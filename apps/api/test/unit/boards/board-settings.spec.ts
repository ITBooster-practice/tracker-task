import { ConflictException } from '@nestjs/common'
import type { UpdateBoard } from '@repo/types'
import { describe, expect, it, vi } from 'vitest'
import type { BoardColumn, Prisma } from '../../../generated/prisma/client'
import { saveBoardSettings } from '../../../src/boards/board-settings'

function column(id: string, position: number): BoardColumn {
	return {
		id,
		position,
		boardId: 'board',
		projectId: 'project',
		key: id,
		title: id,
		color: 'gray',
		isSystem: false,
		createdAt: new Date(0),
		updatedAt: new Date(0),
	}
}

function setup(requireEmpty?: boolean) {
	const columns = [column('source', 0), column('target', 1)]
	const tx = {
		$queryRaw: vi
			.fn()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([]),
		$executeRaw: vi.fn(),
		board: { findUniqueOrThrow: vi.fn().mockResolvedValue({ updatedAt: new Date(0) }) },
		boardColumn: {
			findMany: vi.fn().mockResolvedValue(columns),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		task: {
			count: vi.fn().mockResolvedValue(0),
			aggregate: vi.fn().mockResolvedValue({ _max: { position: 0 } }),
		},
	}
	const dto: UpdateBoard = {
		name: 'Updated board',
		expectedUpdatedAt: new Date(0).toISOString(),
		columnSnapshot: columns.map(({ id, updatedAt }) => ({
			id,
			updatedAt: updatedAt.toISOString(),
		})),
		columns: [{ id: 'target', key: 'target', title: 'Updated target', color: 'red' }],
		removedColumns: [{ id: 'source', targetKey: 'target', requireEmpty }],
	}
	const save = () =>
		saveBoardSettings(tx as unknown as Prisma.TransactionClient, 'project', 'board', dto)
	return { tx, dto, save }
}

describe('Board settings empty-column removal', () => {
	it('rejects tasks added since the snapshot before any task or column writes', async () => {
		const { tx, dto, save } = setup(true)
		tx.task.count.mockResolvedValue(1)
		dto.columns!.push({ key: 'draft', title: 'Draft', color: 'blue' })
		await expect(save()).rejects.toThrow(
			new ConflictException(
				'В колонке появились задачи. Откройте настройки заново и выберите, куда их перенести.',
			),
		)
		expect(tx.task.count).toHaveBeenCalledWith({
			where: { boardColumnId: 'source', projectId: 'project' },
		})
		expect(tx.$queryRaw).toHaveBeenCalledOnce()
		expect(tx.$executeRaw).not.toHaveBeenCalled()
		expect(tx.boardColumn.create).not.toHaveBeenCalled()
		expect(tx.boardColumn.update).not.toHaveBeenCalled()
		expect(tx.boardColumn.delete).not.toHaveBeenCalled()
	})

	it('removes a guarded column that remains empty', async () => {
		const { tx, save } = setup(true)
		await save()
		expect(tx.task.count).toHaveBeenCalledOnce()
		expect(tx.$executeRaw).not.toHaveBeenCalled()
		expect(tx.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'source' } })
		expect(tx.boardColumn.update).toHaveBeenLastCalledWith({
			where: { id: 'target' },
			data: { title: 'Updated target', color: 'red', position: 0 },
		})
	})

	it.each([undefined, false])(
		'transfers existing tasks to the explicit target when requireEmpty is %s',
		async (requireEmpty) => {
			const { tx, save } = setup(requireEmpty)
			tx.$queryRaw.mockResolvedValueOnce([{ id: 'task', position: 0 }])
			await save()
			expect(tx.task.count).not.toHaveBeenCalled()
			expect(tx.$executeRaw).toHaveBeenCalledOnce()
			expect(tx.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'source' } })
		},
	)
})
