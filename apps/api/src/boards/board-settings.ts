import { randomUUID } from 'node:crypto'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import type { UpdateBoard } from '@repo/types'
import { Prisma, type BoardColumn } from 'generated/prisma/client'
import { transferColumnTasks } from './transfer-column-tasks'

export async function saveBoardSettings(
	tx: Prisma.TransactionClient,
	projectId: string,
	boardId: string,
	dto: UpdateBoard,
) {
	const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
		SELECT "id" FROM "Board" WHERE "id" = ${boardId} AND "projectId" = ${projectId} FOR UPDATE
	`)
	if (!locked.length) throw new NotFoundException('Доска не найдена в этом проекте')
	const board = await tx.board.findUniqueOrThrow({ where: { id: boardId } })
	if (dto.expectedUpdatedAt && board.updatedAt.toISOString() !== dto.expectedUpdatedAt)
		throw new ConflictException('Настройки доски изменились. Откройте их заново')
	if (!dto.columns) return
	const columns = await tx.boardColumn.findMany({ where: { boardId } })
	const snapshot = dto.columnSnapshot ?? []
	if (
		snapshot.length !== columns.length ||
		new Set(snapshot.map((item) => item.id)).size !== columns.length ||
		columns.some(
			(column) =>
				!snapshot.some(
					(item) =>
						item.id === column.id && item.updatedAt === column.updatedAt.toISOString(),
				),
		)
	)
		throw new ConflictException('Колонки доски изменились. Откройте настройки заново')
	const retained = dto.columns.filter((column) => column.id)
	const removed = dto.removedColumns ?? []
	const submittedIds = [
		...retained.map((column) => column.id!),
		...removed.map((column) => column.id),
	]
	if (
		submittedIds.length !== columns.length ||
		new Set(submittedIds).size !== columns.length ||
		submittedIds.some((id) => !columns.some((column) => column.id === id))
	)
		throw new BadRequestException('Укажите все существующие колонки ровно один раз')
	for (const current of columns) {
		const next = retained.find((column) => column.id === current.id)
		if (next && next.key !== current.key)
			throw new BadRequestException('Нельзя изменить ключ существующей колонки')
		if (!next && current.isSystem)
			throw new ConflictException('Нельзя удалить системную колонку')
	}
	if (
		removed.some(
			(column) => !dto.columns!.some((target) => target.key === column.targetKey),
		)
	)
		throw new BadRequestException('Выберите оставшуюся колонку для переноса задач')
	for (const removal of removed) {
		if (
			removal.requireEmpty &&
			(await tx.task.count({ where: { boardColumnId: removal.id, projectId } })) > 0
		)
			throw new ConflictException(
				'В колонке появились задачи. Откройте настройки заново и выберите, куда их перенести.',
			)
	}
	let temporary =
		Math.min(0, ...columns.map((column) => column.position)) - dto.columns.length - 1
	if (
		temporary - dto.columns.length - dto.columns.filter((column) => !column.id).length <
		-2_147_483_648
	)
		throw new ConflictException('Недостаточно свободных позиций')
	const nextColumns: BoardColumn[] = []
	for (const draft of dto.columns) {
		const current = columns.find((column) => column.id === draft.id)
		nextColumns.push(
			current ??
				(await tx.boardColumn.create({
					data: {
						boardId,
						projectId,
						key: draft.key,
						title: `__draft_${randomUUID()}`,
						color: draft.color,
						position: temporary--,
					},
				})),
		)
	}
	// Transfer before updating column rows to preserve task/column lock ordering.
	for (const removal of [...removed].sort((a, b) => a.id.localeCompare(b.id))) {
		const source = columns.find((column) => column.id === removal.id)!
		const target =
			nextColumns[dto.columns.findIndex((column) => column.key === removal.targetKey)]!
		await transferColumnTasks(tx, source, target)
		await tx.boardColumn.delete({ where: { id: source.id } })
	}
	// Free unique titles and positions first, including title swaps.
	for (const column of nextColumns)
		await tx.boardColumn.update({
			where: { id: column.id },
			data: { title: `__draft_${randomUUID()}`, position: temporary-- },
		})
	for (const [position, column] of nextColumns.entries()) {
		const draft = dto.columns[position]!
		await tx.boardColumn.update({
			where: { id: column.id },
			data: { title: draft.title, color: draft.color, position },
		})
	}
}
