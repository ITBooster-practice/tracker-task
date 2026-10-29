import {
	createBoardSchema,
	createColumnSchema,
	deleteBoardSchema,
	deleteColumnSchema,
	moveTaskToColumnSchema,
	boardQuerySchema,
	reorderColumnsSchema,
	updateBoardSchema,
	updateColumnSchema,
} from '@repo/types'
import { describe, expect, it } from 'vitest'

describe('Shared board contracts', () => {
	it('normalizes names and supports an empty DELETE body', () => {
		expect(createBoardSchema.parse({ name: '  Разработка  ' })).toEqual({
			name: 'Разработка',
		})
		expect(updateBoardSchema.parse({ name: ' Поддержка ' })).toEqual({
			name: 'Поддержка',
		})
		expect(deleteBoardSchema.parse(undefined)).toEqual({})
		expect(deleteBoardSchema.parse({})).toEqual({})
	})

	it.each(['', '   ', 'x'.repeat(101), 123, null])(
		'rejects an invalid board name: %j',
		(name) => {
			expect(createBoardSchema.safeParse({ name }).success).toBe(false)
			expect(updateBoardSchema.safeParse({ name }).success).toBe(false)
		},
	)

	it('rejects empty updates and changes to server-owned board fields', () => {
		expect(updateBoardSchema.safeParse({}).success).toBe(false)
		expect(createBoardSchema.safeParse({ name: 'Board', isDefault: true }).success).toBe(
			false,
		)
		expect(
			updateBoardSchema.safeParse({ name: 'Board', projectId: 'other' }).success,
		).toBe(false)
		expect(deleteBoardSchema.safeParse({ targetBoardId: 'other' }).success).toBe(false)
	})

	it('defines column creation and renaming without exposing system flags', () => {
		expect(
			createColumnSchema.parse({ key: ' custom ', title: ' Review ', position: 0 }),
		).toEqual({
			key: 'custom',
			title: 'Review',
			position: 0,
		})
		expect(updateColumnSchema.parse({ title: ' Review ' })).toEqual({ title: 'Review' })
		for (const body of [{}, { title: ' ' }, { position: 2 }, { isSystem: false }]) {
			expect(updateColumnSchema.safeParse(body).success).toBe(false)
		}
		expect(
			createColumnSchema.safeParse({ key: 'x', title: 'X', isSystem: true }).success,
		).toBe(false)
	})

	it('requires a transfer target and a nonempty, unique column order', () => {
		expect(deleteColumnSchema.parse({ targetColumnId: 'target' })).toEqual({
			targetColumnId: 'target',
		})
		expect(deleteColumnSchema.safeParse({}).success).toBe(false)
		expect(reorderColumnsSchema.parse({ columnIds: ['second', 'first'] })).toEqual({
			columnIds: ['second', 'first'],
		})
		for (const columnIds of [[], ['first', 'first'], ['first', ' ']]) {
			expect(reorderColumnsSchema.safeParse({ columnIds }).success).toBe(false)
		}
	})

	it.each([-1, 0.5, '1', 2_147_483_648])(
		'rejects an invalid column/task position: %j',
		(position) => {
			expect(
				createColumnSchema.safeParse({ key: 'x', title: 'X', position }).success,
			).toBe(false)
			expect(
				moveTaskToColumnSchema.safeParse({
					fromColumnId: 'source',
					toColumnId: 'target',
					position,
					expectedVersion: 0,
				}).success,
			).toBe(false)
		},
	)

	it('uses column IDs and rejects status-based moves', () => {
		expect(
			moveTaskToColumnSchema.parse({
				fromColumnId: ' source ',
				toColumnId: ' target ',
				position: 0,
				expectedVersion: 0,
			}),
		).toEqual({
			fromColumnId: 'source',
			toColumnId: 'target',
			position: 0,
			expectedVersion: 0,
		})
		expect(
			moveTaskToColumnSchema.safeParse({ status: 'TODO', position: 0 }).success,
		).toBe(false)
	})

	it('rejects mixed or incomplete move bodies', () => {
		const canonical = {
			fromColumnId: 'source',
			toColumnId: 'target',
			position: 0,
			expectedVersion: 0,
		}
		expect(moveTaskToColumnSchema.parse(canonical)).toEqual(canonical)
		for (const body of [
			{ ...canonical, status: 'TODO' },
			{ ...canonical, extra: true },
			{ ...canonical, groupId: 'LOW' },
			{ ...canonical, laneId: 'assignee' },
			{ toColumnId: 'target', position: 0 },
			{ fromColumnId: 'source', position: 0 },
			{ targetColumnId: 'target', position: 0 },
			{ position: 0 },
			{ status: 'TODO', position: 1 },
		])
			expect(moveTaskToColumnSchema.safeParse(body).success).toBe(false)
	})

	it('accepts optional priority and nullable assignee changes in the canonical move', () => {
		const canonical = {
			fromColumnId: 'source',
			toColumnId: 'target',
			position: 0,
			expectedVersion: 0,
		}
		for (const changes of [
			{ priority: 'LOW' },
			{ priority: 'MEDIUM' },
			{ priority: 'HIGH' },
			{ priority: 'CRITICAL', assigneeId: 'user' },
			{ assigneeId: null },
		]) {
			expect(moveTaskToColumnSchema.parse({ ...canonical, ...changes })).toEqual({
				...canonical,
				...changes,
			})
		}
		for (const changes of [
			{ priority: 'UNKNOWN' },
			{ priority: null },
			{ priority: 1 },
			{ assigneeId: '' },
			{ assigneeId: ' ' },
			{ assigneeId: 1 },
			{ assigneeId: [] },
		]) {
			expect(moveTaskToColumnSchema.safeParse({ ...canonical, ...changes }).success).toBe(
				false,
			)
		}
	})

	it.each([undefined, -1, 0.5, '0', 2_147_483_648])(
		'rejects an invalid expected version: %j',
		(expectedVersion) => {
			expect(
				moveTaskToColumnSchema.safeParse({
					fromColumnId: 'source',
					toColumnId: 'target',
					position: 0,
					expectedVersion,
				}).success,
			).toBe(false)
		},
	)

	it('requires a board ID and rejects ambiguous query values', () => {
		expect(boardQuerySchema.parse({ boardId: ' board ' })).toEqual({ boardId: 'board' })
		for (const query of [
			{},
			{ boardId: '' },
			{ boardId: ' ' },
			{ boardId: ['a', 'b'] },
			{ id: 'a' },
		]) {
			expect(boardQuerySchema.safeParse(query).success).toBe(false)
		}
	})
})
