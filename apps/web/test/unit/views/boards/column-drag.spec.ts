import type { KeyboardCoordinateGetter } from '@dnd-kit/core'
import { expect, it, vi } from 'vitest'

import {
	columnKeyboardCoordinates,
	reorderColumnId,
} from '@/views/boards/model/column-drag'

const container = (id: string, type: string) => ({
	id,
	data: { current: { type } },
	disabled: false,
})
const id = (value: string) => `board-column-order:${value}`
function context(over = 'a') {
	const rects = new Map([
		[id('a'), { left: 0, top: 0 }],
		[id('b'), { left: 300, top: 20 }],
		[id('c'), { left: 600, top: 0 }],
		['task', { left: 8, top: 90 }],
		['board-column:a', { left: 16, top: 60 }],
	])
	return {
		over: { id: id(over) },
		droppableRects: rects,
		droppableContainers: {
			getEnabled: () => [
				container('task', 'task'),
				container('board-column:a', 'column'),
				container(id('c'), 'column-order'),
				container(id('a'), 'column-order'),
				container(id('b'), 'column-order'),
			],
		},
	} as unknown as Parameters<KeyboardCoordinateGetter>[1]['context']
}
it('сохраняет двоеточия в ID колонок и отличает их от карточек', () => {
	expect(reorderColumnId('board-column-order:custom:column')).toBe('custom:column')
	expect(reorderColumnId('board-column:custom')).toBeNull()
})
it.each([
	['a', 'ArrowRight', { x: 300, y: 20 }],
	['b', 'ArrowRight', { x: 600, y: 0 }],
	['b', 'ArrowLeft', { x: 0, y: 0 }],
	['a', 'ArrowLeft', undefined],
	['c', 'ArrowRight', undefined],
	['a', 'ArrowDown', undefined],
] as const)(
	'выбирает соседнюю колонку для %s %s, пропуская вложенные области',
	(over, code, expected) => {
		const event = { code, preventDefault: vi.fn() } as unknown as KeyboardEvent
		expect(
			columnKeyboardCoordinates(event, {
				active: id('a'),
				currentCoordinates: { x: 0, y: 0 },
				context: context(over),
			}),
		).toEqual(expected)
	},
)
it('не использует координаты колонок для перетаскивания карточки', () => {
	const event = {
		code: 'ArrowRight',
		preventDefault: vi.fn(),
	} as unknown as KeyboardEvent
	expect(
		columnKeyboardCoordinates(event, {
			active: 'task',
			currentCoordinates: { x: 0, y: 0 },
			context: context(),
		}),
	).toBeUndefined()
})
