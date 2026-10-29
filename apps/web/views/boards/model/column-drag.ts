import {
	closestCenter,
	closestCorners,
	type CollisionDetection,
	type KeyboardCoordinateGetter,
} from '@dnd-kit/core'

import { BOARD_COLUMN_ORDER_PREFIX } from './constants'

export const reorderColumnId = (id: string) =>
	id.startsWith(`${BOARD_COLUMN_ORDER_PREFIX}:`)
		? id.slice(BOARD_COLUMN_ORDER_PREFIX.length + 1)
		: null

export const columnAwareCollision: CollisionDetection = (args) => {
	const ordering = reorderColumnId(String(args.active.id)) !== null
	const droppableContainers = args.droppableContainers.filter(
		(item) => (item.data.current?.type === 'column-order') === ordering,
	)
	return (ordering ? closestCenter : closestCorners)({ ...args, droppableContainers })
}

export const columnKeyboardCoordinates: KeyboardCoordinateGetter = (
	event,
	{ active, context },
) => {
	if (
		reorderColumnId(String(active)) === null ||
		!['ArrowLeft', 'ArrowRight'].includes(event.code)
	)
		return
	event.preventDefault()
	const columns = context.droppableContainers
		.getEnabled()
		.filter(
			(item) =>
				item.data.current?.type === 'column-order' && context.droppableRects.has(item.id),
		)
		.sort(
			(a, b) =>
				context.droppableRects.get(a.id)!.left - context.droppableRects.get(b.id)!.left,
		)
	const index = columns.findIndex((item) => item.id === (context.over?.id ?? active))
	if (index < 0) return
	const target = columns[index + (event.code === 'ArrowRight' ? 1 : -1)]
	const rect = target && context.droppableRects.get(target.id)
	if (rect) return { x: rect.left, y: rect.top }
}
