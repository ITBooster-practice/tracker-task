import { describe, expect, it } from 'vitest'

import {
	columnDraftDestination,
	columnDraftTaskCount,
	newColumn,
	removeColumnDraft,
	restoreColumnDraft,
	type ColumnDraft,
} from '@/views/boards/model/board-editor'

const column = (
	key: string,
	taskCount = 0,
	patch: Partial<ColumnDraft> = {},
): ColumnDraft => ({
	localId: key,
	id: `id-${key}`,
	key,
	title: key,
	color: 'gray',
	isSystem: false,
	taskCount,
	...patch,
})

const activeTaskCount = (columns: ColumnDraft[]) =>
	columns
		.filter((item) => !item.removedTo)
		.reduce((total, item) => total + columnDraftTaskCount(columns, item.key), 0)

describe('черновик колонок доски', () => {
	it('сохраняет исходные счётчики и разрешает конечное назначение цепочки удалений', () => {
		const initial = [column('A', 2), column('B', 3), column('C', 5)]
		const baseline = structuredClone(initial)
		const afterA = removeColumnDraft(initial, 'A', 'B')
		const afterB = removeColumnDraft(afterA, 'B', 'C')

		expect(initial).toEqual(baseline)
		expect(afterB.map((item) => item.taskCount)).toEqual([2, 3, 5])
		expect(afterB.map((item) => item.removedTo)).toEqual(['B', 'C', undefined])
		expect(columnDraftDestination(afterB, 'A')?.key).toBe('C')
		expect(columnDraftDestination(afterB, 'B')?.key).toBe('C')
		expect(columnDraftTaskCount(afterB, 'A')).toBe(2)
		expect(columnDraftTaskCount(afterB, 'B')).toBe(5)
		expect(columnDraftTaskCount(afterB, 'C')).toBe(10)
		for (const state of [initial, afterA, afterB]) expect(activeTaskCount(state)).toBe(10)
	})

	it('отмена промежуточного удаления возвращает в него зависимые переносы', () => {
		const initial = [column('A', 2), column('B', 3), column('C', 5)]
		const removed = removeColumnDraft(removeColumnDraft(initial, 'A', 'B'), 'B', 'C')
		const restoredB = restoreColumnDraft(removed, 'B')

		expect(restoredB[0]?.removedTo).toBe('B')
		expect(restoredB[1]?.removedTo).toBeUndefined()
		expect(columnDraftDestination(restoredB, 'A')?.key).toBe('B')
		expect(columnDraftTaskCount(restoredB, 'B')).toBe(5)
		expect(columnDraftTaskCount(restoredB, 'C')).toBe(5)
		expect(activeTaskCount(restoredB)).toBe(10)
		expect(restoreColumnDraft(restoredB, 'A')).toEqual(initial)
	})

	it('отмена первого удаления возвращает только его собственные задачи из цепочки', () => {
		const initial = [column('A', 2), column('B', 3), column('C', 5)]
		const removed = removeColumnDraft(removeColumnDraft(initial, 'A', 'B'), 'B', 'C')
		const restoredA = restoreColumnDraft(removed, 'A')

		expect(columnDraftTaskCount(restoredA, 'A')).toBe(2)
		expect(columnDraftTaskCount(restoredA, 'B')).toBe(3)
		expect(columnDraftTaskCount(restoredA, 'C')).toBe(8)
		expect(columnDraftDestination(restoredA, 'B')?.key).toBe('C')
		expect(activeTaskCount(restoredA)).toBe(10)
	})

	it('отмена автоматического удаления пустой колонки снимает проверку пустоты', () => {
		const initial = [column('A'), column('B', 1)]
		const removed = removeColumnDraft(initial, 'A', 'B', true)

		expect(removed[0]).toMatchObject({ removedTo: 'B', requireEmpty: true })
		expect(restoreColumnDraft(removed, 'A')).toEqual(initial)
	})

	it('не удаляет отсутствующий, уже удалённый, системный или последний источник', () => {
		const initial = [column('A', 2, { isSystem: true }), column('B', 3)]
		expect(removeColumnDraft(initial, 'missing', 'B')).toBe(initial)
		expect(removeColumnDraft(initial, 'A', 'B')).toBe(initial)
		expect(removeColumnDraft(initial, 'B', 'B')).toBe(initial)
		expect(removeColumnDraft(initial, 'B', 'missing')).toBe(initial)

		const removed = removeColumnDraft(initial, 'B', 'A')
		expect(removeColumnDraft(removed, 'B', 'A')).toBe(removed)
		const last = [column('A')]
		expect(removeColumnDraft(last, 'A', 'A')).toBe(last)
	})

	it('не использует удалённую колонку как новое назначение', () => {
		const initial = [column('A'), column('B'), column('C')]
		const removed = removeColumnDraft(initial, 'B', 'C')
		expect(removeColumnDraft(removed, 'A', 'B')).toBe(removed)
	})

	it('не зацикливается при повреждённой цепочке или отсутствующем назначении', () => {
		const cyclic = [
			column('A', 2, { removedTo: 'B' }),
			column('B', 3, { removedTo: 'A' }),
		]
		expect(columnDraftDestination(cyclic, 'A')).toBeUndefined()
		expect(columnDraftTaskCount(cyclic, 'A')).toBe(5)
		expect(columnDraftTaskCount(cyclic, 'missing')).toBe(0)
		expect(
			columnDraftDestination([column('A', 2, { removedTo: 'missing' })], 'A'),
		).toBeUndefined()
		expect(columnDraftDestination(cyclic, 'missing')).toBeUndefined()
	})

	it('отмена новой колонки убирает её из массива и перенаправляет входящие переносы', () => {
		const draft = newColumn()
		const initial = [column('A', 2), column('B', 3), column('C', 5), draft]
		const intoNew = removeColumnDraft(
			removeColumnDraft(initial, 'A', 'B'),
			'B',
			draft.key,
		)
		const withoutNew = removeColumnDraft(intoNew, draft.localId, 'C')

		expect(draft).toMatchObject({ title: '', taskCount: 0, isNew: true })
		expect(draft.id).toBeUndefined()
		expect(withoutNew.map((item) => item.key)).toEqual(['A', 'B', 'C'])
		expect(withoutNew.map((item) => item.removedTo)).toEqual(['B', 'C', undefined])
		expect(columnDraftDestination(withoutNew, 'A')?.key).toBe('C')
		expect(activeTaskCount(withoutNew)).toBe(10)
		expect(restoreColumnDraft(withoutNew, 'B').map((item) => item.removedTo)).toEqual([
			'B',
			undefined,
			undefined,
		])
	})
})
