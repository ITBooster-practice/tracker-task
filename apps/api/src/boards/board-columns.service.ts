import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, TaskStatus, TeamRole, type BoardColumn } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateColumnDto } from './dto/create-column.dto'
import { DeleteColumnDto } from './dto/delete-column.dto'
import { ReorderColumnsDto } from './dto/reorder-columns.dto'
import { UpdateColumnDto } from './dto/update-column.dto'

const MAX_POSITION = 2_147_483_647
const MIN_POSITION = -2_147_483_648
const columnOrder = [{ position: 'asc' }, { id: 'asc' }] as const

@Injectable()
export class BoardColumnsService {
	constructor(private readonly prisma: PrismaService) {}

	private async mutate<T>(
		boardId: string,
		userId: string,
		operation: (tx: Prisma.TransactionClient, projectId: string) => Promise<T>,
	): Promise<T> {
		const board = await this.prisma.board.findUnique({
			where: { id: boardId },
			select: { projectId: true, project: { select: { teamId: true } } },
		})
		if (!board) throw new NotFoundException('Доска не найдена')
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId: board.project.teamId, userId } },
		})
		if (!member || (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN)) {
			throw new ForbiddenException(
				'Управлять колонками могут только OWNER и ADMIN команды',
			)
		}

		try {
			return await this.prisma.$transaction(
				async (tx) => {
					// Serialize structural changes before reading the current column order.
					const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
						SELECT "id" FROM "Board"
						WHERE "id" = ${boardId} AND "projectId" = ${board.projectId}
						FOR UPDATE
					`)
					if (!locked.length) throw new NotFoundException('Доска больше не существует')
					return operation(tx, board.projectId)
				},
				{ timeout: 10_000 },
			)
		} catch (error) {
			this.writeError(error)
		}
	}

	private columns(tx: Prisma.TransactionClient, boardId: string) {
		return tx.boardColumn.findMany({ where: { boardId }, orderBy: [...columnOrder] })
	}

	private findColumn(columns: BoardColumn[], columnId: string) {
		const column = columns.find((item) => item.id === columnId)
		if (!column) throw new NotFoundException('Колонка не найдена в этой доске')
		return column
	}

	private temporaryPosition(occupied: Set<number>, start = -1) {
		let position = start
		while (occupied.has(position)) position--
		if (position < MIN_POSITION) {
			throw new ConflictException('Недостаточно свободных позиций для изменения колонок')
		}
		return position
	}

	private async setOrder(tx: Prisma.TransactionClient, columns: BoardColumn[]) {
		if (columns.every((column, index) => column.position === index)) return
		// Unique (boardId, position) is immediate: move every row to a free slot first.
		const occupied = new Set(columns.map((column) => column.position))
		let temporary = -1
		for (const column of columns) {
			temporary = this.temporaryPosition(occupied, temporary)
			await tx.boardColumn.update({
				where: { id: column.id },
				data: { position: temporary },
			})
			temporary--
		}
		for (const [position, column] of columns.entries()) {
			await tx.boardColumn.update({ where: { id: column.id }, data: { position } })
		}
	}

	create(boardId: string, userId: string, dto: CreateColumnDto) {
		return this.mutate(boardId, userId, async (tx, projectId) => {
			const columns = await this.columns(tx, boardId)
			const position = dto.position ?? columns.length
			if (position > columns.length) {
				throw new BadRequestException('Позиция колонки выходит за границы доски')
			}
			const created = await tx.boardColumn.create({
				data: {
					boardId,
					projectId,
					key: dto.key,
					title: dto.title,
					position: this.temporaryPosition(
						new Set(columns.map((column) => column.position)),
					),
				},
			})
			columns.splice(position, 0, created)
			await this.setOrder(tx, columns)
			return tx.boardColumn.findUniqueOrThrow({ where: { id: created.id } })
		})
	}

	update(boardId: string, columnId: string, userId: string, dto: UpdateColumnDto) {
		return this.mutate(boardId, userId, async (tx) => {
			const column = this.findColumn(await this.columns(tx, boardId), columnId)
			if (column.isSystem && dto.key !== undefined && dto.key !== column.key) {
				throw new ConflictException('Нельзя изменить ключ системной колонки')
			}
			return tx.boardColumn.update({ where: { id: column.id }, data: dto })
		})
	}

	reorder(boardId: string, userId: string, dto: ReorderColumnsDto) {
		return this.mutate(boardId, userId, async (tx) => {
			const columns = await this.columns(tx, boardId)
			const byId = new Map(columns.map((column) => [column.id, column]))
			if (
				dto.columnIds.length !== columns.length ||
				new Set(dto.columnIds).size !== columns.length ||
				dto.columnIds.some((id) => !byId.has(id))
			) {
				throw new BadRequestException('Укажите все колонки этой доски ровно один раз')
			}
			await this.setOrder(
				tx,
				dto.columnIds.map((id) => byId.get(id)!),
			)
			return this.columns(tx, boardId)
		})
	}

	remove(boardId: string, columnId: string, userId: string, dto: DeleteColumnDto) {
		return this.mutate(boardId, userId, async (tx) => {
			const columns = await this.columns(tx, boardId)
			const source = this.findColumn(columns, columnId)
			if (columns.length <= 1)
				throw new ConflictException('Нельзя удалить последнюю колонку')
			if (source.isSystem) throw new ConflictException('Нельзя удалить системную колонку')
			if (columnId === dto.targetColumnId) {
				throw new BadRequestException('Выберите другую колонку для переноса задач')
			}
			const target = this.findColumn(columns, dto.targetColumnId)
			// Do not lock column rows before tasks: legacy task writes acquire locks in the opposite order.
			const tasks = await tx.$queryRaw<{ id: string; position: number }[]>(Prisma.sql`
				SELECT "id", "position" FROM "Task"
				WHERE "boardColumnId" = ${source.id}
				ORDER BY "position", "id" FOR UPDATE
			`)
			if (tasks.length) {
				// Row values can change while FOR UPDATE waits, after SQL has sorted its snapshot.
				tasks.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
				const aggregate = await tx.task.aggregate({
					where: { boardColumnId: target.id },
					_max: { position: true },
				})
				const lastPosition = Math.max(-1, aggregate._max.position ?? -1)
				if (lastPosition + tasks.length > MAX_POSITION) {
					throw new ConflictException('Недостаточно позиций в целевой колонке')
				}
				const status =
					target.isSystem && Object.values(TaskStatus).includes(target.key as TaskStatus)
						? Prisma.sql`, "status" = ${target.key}::"TaskStatus"`
						: Prisma.empty
				for (let offset = 0; offset < tasks.length; offset += 500) {
					const positions = tasks
						.slice(offset, offset + 500)
						.map(
							(task, index) =>
								Prisma.sql`(${task.id}, ${lastPosition + offset + index + 1}::integer)`,
						)
					await tx.$executeRaw(Prisma.sql`
						UPDATE "Task" AS task
						SET "boardColumnId" = ${target.id}, "position" = moved.position,
							"updatedAt" = ${new Date()} ${status}
						FROM (VALUES ${Prisma.join(positions)}) AS moved(id, position)
						WHERE task."id" = moved.id AND task."boardColumnId" = ${source.id}
					`)
				}
			}
			// The FK rejects late arrivals into the source and rolls back the whole transfer.
			await tx.boardColumn.delete({ where: { id: source.id } })
			await this.setOrder(
				tx,
				columns.filter((column) => column.id !== source.id),
			)
		})
	}

	private writeError(error: unknown): never {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				throw new ConflictException('Ключ или название колонки уже заняты в этой доске')
			}
			if (error.code === 'P2025')
				throw new NotFoundException('Колонка больше не существует')
			if (
				['P2003', 'P2034'].includes(error.code) ||
				(error.code === 'P2010' &&
					['23503', '40P01', '40001'].includes(String(error.meta?.code)))
			) {
				throw new ConflictException('Данные доски изменились, повторите операцию')
			}
		}
		throw error
	}
}
