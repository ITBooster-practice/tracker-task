import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, TaskStatus, TeamRole, type TeamMember } from 'generated/prisma/client'
import {
	DEFAULT_TASK_SORT_BY,
	DEFAULT_TASK_SORT_ORDER,
	type TaskFilterQuery,
	type TaskLabelsQuery,
} from '@repo/types'
import { PrismaService } from '../../prisma/prisma.service'
import {
	buildPaginatedResponse,
	getPaginationPrismaParams,
	type PaginationOptions,
} from '../utils/pagination.util'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import {
	escapeTaskSearch,
	resolveTaskLabels,
	serializeTaskLabels,
	taskLabelsInclude,
} from './task-labels.util'
import { lockColumnTasks, updateTaskPlacement } from './task-placement'
const taskKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

@Injectable()
export class TasksService {
	constructor(private readonly prisma: PrismaService) {}

	private async assertTeamMember(teamId: string, userId: string): Promise<TeamMember> {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})

		if (!member) {
			throw new ForbiddenException('У вас нет доступа к этой команде')
		}

		return member
	}

	private async findProjectOrThrow(teamId: string, projectId: string) {
		const project = await this.prisma.project.findUnique({ where: { id: projectId } })

		if (!project) {
			throw new NotFoundException('Проект не найден')
		}

		if (project.teamId !== teamId) {
			throw new NotFoundException('Проект не относится к этой команде')
		}

		return project
	}

	async create(teamId: string, projectId: string, userId: string, dto: CreateTaskDto) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)

		if (dto.status && !Object.values(TaskStatus).includes(dto.status as TaskStatus)) {
			throw new BadRequestException('Недопустимый статус задачи')
		}
		const requestedStatus = (dto.status ?? TaskStatus.TODO) as TaskStatus
		const initialColumn = await this.prisma.boardColumn.findFirst({
			where: dto.boardColumnId
				? { id: dto.boardColumnId, projectId }
				: { projectId, key: requestedStatus, isSystem: true, board: { isDefault: true } },
		})
		if (!initialColumn) throw new NotFoundException('Колонка не найдена в этом проекте')

		return this.prisma.$transaction(
			async (tx) => {
				// Use the same board lock as task moves and column changes.
				const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
				SELECT "id" FROM "Board"
				WHERE "id" = ${initialColumn.boardId} AND "projectId" = ${projectId}
				FOR UPDATE
			`)
				if (!locked.length) throw new NotFoundException('Доска больше не существует')
				const column = await tx.boardColumn.findFirst({
					where: { id: initialColumn.id, boardId: initialColumn.boardId, projectId },
				})
				if (!column) throw new NotFoundException('Колонка больше не существует')
				const status =
					column.isSystem && Object.values(TaskStatus).includes(column.key as TaskStatus)
						? (column.key as TaskStatus)
						: requestedStatus
				const aggregate = await tx.task.aggregate({
					where: { projectId, boardColumnId: column.id },
					_max: { position: true },
				})
				const maxPosition = aggregate._max.position
				const labels = await resolveTaskLabels(tx, projectId, dto.labels ?? [])
				const created = await tx.task.create({
					include: taskLabelsInclude,
					data: {
						title: dto.title,
						description: dto.description,
						status,
						priority: dto.priority as never,
						type: dto.type,
						assigneeId: dto.assigneeId,
						dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
						projectId,
						boardColumnId: column.id,
						position: maxPosition === null ? 1 : maxPosition + 1,
						createdById: userId,
						labelAssignments: {
							create: labels.map(({ id: labelId }) => ({ labelId })),
						},
					},
				})
				return serializeTaskLabels(created)
			},
			{ timeout: 10_000 },
		)
	}

	async findAll(
		teamId: string,
		projectId: string,
		userId: string,
		filters: Partial<Omit<TaskFilterQuery, 'page' | 'limit'>>,
		pagination: PaginationOptions,
	) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)

		const search = filters.search?.trim()
		const titleSearch = {
			title: {
				contains: search ? escapeTaskSearch(search) : undefined,
				mode: 'insensitive' as const,
			},
		}
		const labelSearch: Prisma.TaskWhereInput = {
			labelAssignments: {
				some: {
					label: {
						name: {
							contains: search ? escapeTaskSearch(search) : undefined,
							mode: 'insensitive',
						},
					},
				},
			},
		}
		const where: Prisma.TaskWhereInput = {
			projectId,
			...(filters.status && { status: filters.status as TaskStatus }),
			...(filters.priority && { priority: filters.priority }),
			...(filters.assigneeId && { assigneeId: filters.assigneeId }),
			...(filters.type && { type: filters.type }),
			// Task keys are the stable UUIDs exposed by the board and task details.
			...(search && {
				OR: [
					titleSearch,
					...(taskKeyPattern.test(search) ? [{ id: search }] : []),
					labelSearch,
				],
			}),
		}
		const sortBy = filters.sortBy ?? DEFAULT_TASK_SORT_BY
		const sortOrder = filters.sortOrder ?? DEFAULT_TASK_SORT_ORDER

		const { skip, take } = getPaginationPrismaParams(pagination)

		const [tasks, total] = await Promise.all([
			this.prisma.task.findMany({
				include: taskLabelsInclude,
				where,
				orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
				skip,
				take,
			}),
			this.prisma.task.count({ where }),
		])

		return buildPaginatedResponse(tasks.map(serializeTaskLabels), pagination, total)
	}

	async findLabels(
		teamId: string,
		projectId: string,
		userId: string,
		query: TaskLabelsQuery,
	) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)
		const search = query.search?.trim()
		const labels = await this.prisma.taskLabel.findMany({
			where: {
				projectId,
				...(search && {
					name: { contains: escapeTaskSearch(search), mode: 'insensitive' },
				}),
			},
			select: { name: true },
			orderBy: { key: 'asc' },
			take: 20,
		})
		return labels.map(({ name }) => name)
	}

	async findOne(teamId: string, projectId: string, taskId: string, userId: string) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)
		return this.findTaskOrThrow(projectId, taskId)
	}

	private async findTaskOrThrow(projectId: string, taskId: string) {
		const task = await this.prisma.task.findUnique({
			where: { id: taskId },
			include: taskLabelsInclude,
		})

		if (!task || task.projectId !== projectId) {
			throw new NotFoundException('Задача не найдена в этом проекте')
		}

		return serializeTaskLabels(task)
	}

	async update(
		teamId: string,
		projectId: string,
		taskId: string,
		userId: string,
		dto: UpdateTaskDto,
	) {
		const member = await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)
		const task = await this.findTaskOrThrow(projectId, taskId)

		const isAdminOrOwner =
			member.role === TeamRole.ADMIN || member.role === TeamRole.OWNER
		const isCreator = task.createdById === userId

		if (!isCreator && !isAdminOrOwner) {
			throw new ForbiddenException('Недостаточно прав для выполнения этого действия')
		}

		if (dto.status && !Object.values(TaskStatus).includes(dto.status as TaskStatus)) {
			throw new BadRequestException('Недопустимый статус задачи')
		}
		const initialColumn = await this.prisma.boardColumn.findFirst({
			where: { id: task.boardColumnId, projectId },
		})
		if (!initialColumn) throw new NotFoundException('Колонка не найдена в этом проекте')

		try {
			return await this.prisma.$transaction(
				async (tx) => {
					// Match task moves and settings: lock the board before reading placement or tasks.
					const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
						SELECT "id" FROM "Board"
						WHERE "id" = ${initialColumn.boardId} AND "projectId" = ${projectId}
						FOR UPDATE
					`)
					if (!locked.length) throw new NotFoundException('Доска больше не существует')
					const source = await tx.boardColumn.findFirst({
						where: { id: initialColumn.id, boardId: initialColumn.boardId, projectId },
					})
					if (!source)
						throw new ConflictException('Колонка задачи изменилась, обновите данные')
					const target =
						dto.boardColumnId !== undefined ||
						(dto.status !== undefined && source.isSystem)
							? await tx.boardColumn.findFirst({
									where: dto.boardColumnId
										? { id: dto.boardColumnId, boardId: source.boardId, projectId }
										: {
												boardId: source.boardId,
												projectId,
												key: dto.status,
												isSystem: true,
											},
								})
							: source
					if (!target) throw new NotFoundException('Колонка не найдена в текущей доске')
					const tasks =
						source.id === target.id
							? []
							: await lockColumnTasks(tx, projectId, [source.id, target.id])
					const moving =
						source.id === target.id ? task : tasks.find(({ id }) => id === taskId)
					if (
						!moving ||
						moving.boardColumnId !== source.id ||
						moving.version !== task.version
					) {
						throw new ConflictException(
							'Задача изменилась. Обновите данные и повторите попытку.',
						)
					}
					const labels =
						dto.labels === undefined
							? undefined
							: await resolveTaskLabels(tx, projectId, dto.labels)
					const updated = await updateTaskPlacement(tx, {
						projectId,
						source,
						target,
						moving,
						tasks,
						expectedVersion: task.version,
						data: {
							...(dto.title !== undefined && { title: dto.title }),
							...(dto.description !== undefined && { description: dto.description }),
							...(dto.status !== undefined && { status: dto.status as never }),
							...(dto.priority !== undefined && { priority: dto.priority as never }),
							...(dto.type !== undefined && { type: dto.type }),
							...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
							...(dto.dueDate !== undefined && {
								dueDate: dto.dueDate === null ? null : new Date(dto.dueDate),
							}),
							...(labels !== undefined && {
								labelAssignments: {
									deleteMany: {},
									create: labels.map(({ id: labelId }) => ({ labelId })),
								},
							}),
						},
					})
					return serializeTaskLabels(updated)
				},
				{ timeout: 10_000 },
			)
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
				throw new ConflictException(
					'Задача изменилась. Обновите данные и повторите попытку.',
				)
			throw error
		}
	}

	async remove(teamId: string, projectId: string, taskId: string, userId: string) {
		const member = await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)

		const isAdminOrOwner =
			member.role === TeamRole.ADMIN || member.role === TeamRole.OWNER

		if (!isAdminOrOwner) {
			throw new ForbiddenException('Недостаточно прав для выполнения этого действия')
		}

		await this.findTaskOrThrow(projectId, taskId)

		await this.prisma.task.delete({ where: { id: taskId } })

		return { message: 'Задача успешно удалена', success: true }
	}
}
