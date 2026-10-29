import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import type {
	MoveTaskToColumn,
	Priority,
	TaskMoveConflict,
	TaskMoveConflictReason,
} from '@repo/types'
import { Prisma, TaskStatus, TeamRole } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type OrderedTask = {
	id: string
	boardColumnId: string
	position: number
	version: number
	priority: Priority
	assigneeId: string | null
	createdById: string
}
const byPosition = (a: OrderedTask, b: OrderedTask) =>
	a.position - b.position || a.id.localeCompare(b.id)

@Injectable()
export class BoardTasksService {
	constructor(private readonly prisma: PrismaService) {}

	private async assertAccess(teamId: string, projectId: string, userId: string) {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})
		if (!member) throw new ForbiddenException('У вас нет доступа к этой команде')
		const project = await this.prisma.project.findUnique({ where: { id: projectId } })
		if (!project || project.teamId !== teamId) {
			throw new NotFoundException('Проект не найден в этой команде')
		}
		return member
	}

	async getBoard(teamId: string, projectId: string, boardId: string, userId: string) {
		await this.assertAccess(teamId, projectId, userId)
		return this.prisma.$transaction(
			async (tx) => {
				const result = await tx.board.findUnique({
					where: { id: boardId, projectId },
					include: {
						columns: {
							orderBy: [{ position: 'asc' }, { id: 'asc' }],
							include: { tasks: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
						},
					},
				})
				if (!result) throw new NotFoundException('Доска не найдена в этом проекте')
				const { columns, ...board } = result
				return { board, columns }
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		)
	}

	private async columns(
		client: Prisma.TransactionClient,
		projectId: string,
		ids: string[],
	) {
		const columns = await client.boardColumn.findMany({
			where: { id: { in: ids }, projectId },
		})
		if (new Set(columns.map((column) => column.id)).size !== new Set(ids).size) {
			throw new NotFoundException('Колонка не найдена в этом проекте')
		}
		return columns
	}

	async moveTask(
		teamId: string,
		projectId: string,
		taskId: string,
		userId: string,
		dto: MoveTaskToColumn,
	) {
		const member = await this.assertAccess(teamId, projectId, userId)
		const ids = [dto.fromColumnId, dto.toColumnId]
		const initialColumns = await this.columns(this.prisma, projectId, ids)
		const boardIds = [...new Set(initialColumns.map((column) => column.boardId))]
		try {
			return await this.prisma.$transaction(
				async (tx) => {
					// A common order supports opposite transfers and column deletion without lock inversion.
					const boards = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
					SELECT "id" FROM "Board" WHERE "id" IN (${Prisma.join(boardIds)})
					AND "projectId" = ${projectId} ORDER BY "id" FOR UPDATE
				`)
					if (boards.length !== boardIds.length)
						throw new NotFoundException('Доска больше не существует')
					const columns = await this.columns(tx, projectId, ids)
					const source = columns.find((column) => column.id === dto.fromColumnId)!
					const target = columns.find((column) => column.id === dto.toColumnId)!
					const tasks = await tx.$queryRaw<OrderedTask[]>(Prisma.sql`
						SELECT "id", "boardColumnId", "position", "version", "priority", "assigneeId", "createdById" FROM "Task"
					WHERE "projectId" = ${projectId} AND "boardColumnId" IN (${Prisma.join(ids)})
					ORDER BY "id" FOR UPDATE
				`)
					const moving = tasks.find((task) => task.id === taskId)
					if (!moving) {
						const exists = await tx.task.findUnique({
							where: { id: taskId, projectId },
							select: { id: true },
						})
						if (!exists) throw new NotFoundException('Задача не найдена в этом проекте')
					}
					if (!moving || moving.boardColumnId !== source.id) {
						throw this.conflict(
							taskId,
							'SOURCE_CHANGED',
							'Исходная колонка задачи изменилась, обновите доску',
						)
					}
					if (moving.version !== dto.expectedVersion) {
						throw this.conflict(
							taskId,
							'VERSION_MISMATCH',
							'Задача изменилась, обновите доску',
						)
					}
					const priorityChanged =
						dto.priority !== undefined && dto.priority !== moving.priority
					const assigneeChanged =
						dto.assigneeId !== undefined && dto.assigneeId !== moving.assigneeId
					if (
						(priorityChanged || assigneeChanged) &&
						moving.createdById !== userId &&
						member.role !== TeamRole.ADMIN &&
						member.role !== TeamRole.OWNER
					) {
						throw new ForbiddenException(
							'Недостаточно прав для выполнения этого действия',
						)
					}
					if (assigneeChanged && dto.assigneeId !== null) {
						const assignee = await tx.teamMember.findUnique({
							where: { teamId_userId: { teamId, userId: dto.assigneeId! } },
							select: { id: true },
						})
						if (!assignee) {
							throw new BadRequestException('Исполнитель не является участником команды')
						}
					}
					const targetTasks = tasks
						.filter((task) => task.boardColumnId === target.id && task.id !== taskId)
						.sort(byPosition)
					if (dto.position > targetTasks.length) {
						throw new BadRequestException('Позиция задачи выходит за границы колонки')
					}
					targetTasks.splice(dto.position, 0, moving)
					const updated = await tx.task.update({
						where: {
							id: taskId,
							projectId,
							boardColumnId: source.id,
							version: dto.expectedVersion,
						},
						data: {
							boardColumnId: target.id,
							position: dto.position,
							version: { increment: 1 },
							...(priorityChanged ? { priority: dto.priority } : {}),
							...(assigneeChanged ? { assigneeId: dto.assigneeId } : {}),
							...(target.isSystem &&
							Object.values(TaskStatus).includes(target.key as TaskStatus)
								? { status: target.key as TaskStatus }
								: {}),
						},
					})
					await this.setPositions(
						tx,
						targetTasks
							.map((task, nextPosition) => ({
								...task,
								nextPosition,
							}))
							.filter((task) => task.id !== taskId),
					)
					if (source.id !== target.id) {
						const remaining = tasks
							.filter((task) => task.boardColumnId === source.id && task.id !== taskId)
							.sort(byPosition)
						await this.setPositions(
							tx,
							remaining.map((task, nextPosition) => ({ ...task, nextPosition })),
						)
					}
					return updated
				},
				{ timeout: 10_000 },
			)
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				const adapter = error.meta?.driverAdapterError
				const cause =
					adapter && typeof adapter === 'object' && 'cause' in adapter
						? adapter.cause
						: undefined
				const sqlCode =
					error.meta?.code ??
					(cause && typeof cause === 'object' && 'originalCode' in cause
						? cause.originalCode
						: undefined)
				if (
					['P2003', 'P2025', 'P2034'].includes(error.code) ||
					(error.code === 'P2010' &&
						['23503', '40P01', '40001'].includes(String(sqlCode)))
				) {
					throw this.conflict(
						taskId,
						'WRITE_CONFLICT',
						'Данные доски изменились, обновите доску',
					)
				}
			}
			throw error
		}
	}

	private conflict(taskId: string, reason: TaskMoveConflictReason, message: string) {
		const response: TaskMoveConflict = {
			statusCode: 409,
			code: 'TASK_MOVE_CONFLICT',
			taskId,
			reason,
			message,
		}
		return new ConflictException(response)
	}

	private async setPositions(
		tx: Prisma.TransactionClient,
		tasks: (OrderedTask & { nextPosition: number })[],
	) {
		const changed = tasks.filter((task) => task.position !== task.nextPosition)
		for (let offset = 0; offset < changed.length; offset += 500) {
			const rows = changed
				.slice(offset, offset + 500)
				.map((task) => Prisma.sql`(${task.id}, ${task.nextPosition}::integer)`)
			await tx.$executeRaw(Prisma.sql`
				UPDATE "Task" AS task SET "position" = ordered.position, "version" = task."version" + 1, "updatedAt" = ${new Date()}
				FROM (VALUES ${Prisma.join(rows)}) AS ordered(id, position) WHERE task."id" = ordered.id
			`)
		}
	}
}
