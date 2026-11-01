import type { BoardColumnColor } from '@repo/types'

export interface ColumnDraft {
	localId: string
	id?: string
	key: string
	title: string
	color: BoardColumnColor
	isSystem: boolean
	taskCount: number
	isNew?: true
	removedTo?: string
	requireEmpty?: true
}

export const initialColumns = (): ColumnDraft[] =>
	[
		['BACKLOG', 'Бэклог', 'gray'],
		['TODO', 'К выполнению', 'blue'],
		['IN_PROGRESS', 'В работе', 'yellow'],
		['IN_REVIEW', 'На проверке', 'violet'],
		['DONE', 'Готово', 'green'],
	].map(([key, title, color]) => ({
		localId: key!,
		key: key!,
		title: title!,
		color: color as BoardColumnColor,
		isSystem: false,
		taskCount: 0,
	}))
export const newColumn = (): ColumnDraft => {
	const key = `column_${crypto.randomUUID()}`
	return {
		localId: key,
		key,
		title: '',
		color: 'gray',
		isSystem: false,
		taskCount: 0,
		isNew: true,
	}
}

export function columnDraftDestination(
	columns: readonly ColumnDraft[],
	key: string,
): ColumnDraft | undefined {
	const visited = new Set<string>()
	let column = columns.find((item) => item.key === key)
	while (column?.removedTo) {
		if (visited.has(column.key)) return undefined
		visited.add(column.key)
		const targetKey: string = column.removedTo
		column = columns.find((item) => item.key === targetKey)
	}
	return column
}

export function columnDraftTaskCount(columns: readonly ColumnDraft[], key: string) {
	return columns.reduce((count, source) => {
		const visited = new Set<string>()
		let column: ColumnDraft | undefined = source
		while (column && !visited.has(column.key)) {
			if (column.key === key) return count + source.taskCount
			visited.add(column.key)
			const targetKey: string | undefined = column.removedTo
			column = targetKey ? columns.find((item) => item.key === targetKey) : undefined
		}
		return count
	}, 0)
}

export function removeColumnDraft(
	columns: ColumnDraft[],
	localId: string,
	targetKey: string,
	requireEmpty = false,
): ColumnDraft[] {
	const source = columns.find((column) => column.localId === localId)
	const target = columns.find((column) => column.key === targetKey && !column.removedTo)
	if (
		!source ||
		source.removedTo ||
		source.isSystem ||
		!target ||
		target === source ||
		columns.filter((column) => !column.removedTo).length <= 1
	)
		return columns
	if (source.isNew) {
		return columns
			.filter((column) => column !== source)
			.map((column) =>
				column.removedTo === source.key ? { ...column, removedTo: targetKey } : column,
			)
	}
	return columns.map((column) =>
		column === source
			? {
					...column,
					removedTo: targetKey,
					...(requireEmpty && { requireEmpty: true as const }),
				}
			: column,
	)
}

export function restoreColumnDraft(
	columns: ColumnDraft[],
	localId: string,
): ColumnDraft[] {
	return columns.map((column) => {
		if (column.localId !== localId || !column.removedTo) return column
		const restored = { ...column }
		delete restored.removedTo
		delete restored.requireEmpty
		return restored
	})
}
