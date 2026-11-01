import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import type {
	MoveTaskToColumn,
	TaskMoveConflict,
	TaskMoveConflictReason,
} from '@repo/types'
import { Prisma, TeamRole } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { serializeTaskLabels, taskLabelsInclude } from './task-labels.util'
import { lockColumnTasks, updateTaskPlacement } from './task-placement'

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
							include: {
								tasks: {
									include: taskLabelsInclude,
									orderBy: [{ position: 'asc' }, { id: 'asc' }],
								},
							},
						},
					},
				})
				if (!result) throw new NotFoundException('Доска не найдена в этом проекте')
				const { columns, ...board } = result
				return {
					board,
					columns: columns.map((column) => ({
						...column,
						tasks: column.tasks.map(serializeTaskLabels),
					})),
				}
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
					const tasks = await lockColumnTasks(tx, projectId, ids)
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
					const updated = await updateTaskPlacement(tx, {
						projectId,
						source,
						target,
						moving,
						tasks,
						expectedVersion: dto.expectedVersion,
						position: dto.position,
						data: {
							...(priorityChanged ? { priority: dto.priority } : {}),
							...(assigneeChanged ? { assigneeId: dto.assigneeId } : {}),
						},
					})
					return serializeTaskLabels(updated)
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
}
