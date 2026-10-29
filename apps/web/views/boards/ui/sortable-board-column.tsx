import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useId, type ComponentProps } from 'react'

import { Button } from '@repo/ui'
import { GripVertical } from '@repo/ui/icons'

import { BOARD_COLUMN_ORDER_PREFIX } from '../model/constants'
import { BoardColumn } from './board-column'

export function SortableBoardColumn({
	sortingDisabled,
	...props
}: ComponentProps<typeof BoardColumn> & { sortingDisabled: boolean }) {
	const instructionsId = useId()
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: `${BOARD_COLUMN_ORDER_PREFIX}:${props.column.id}`,
		data: { type: 'column-order', columnId: props.column.id },
		disabled: sortingDisabled,
	})
	return (
		<div
			ref={setNodeRef}
			className={isDragging ? 'opacity-40' : undefined}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<span id={instructionsId} className='sr-only'>
				Нажмите Пробел, чтобы взять колонку. Стрелки влево и вправо меняют её положение.
				Пробел или Enter сохраняет порядок, Escape отменяет перенос.
			</span>
			<BoardColumn
				{...props}
				dragHandle={
					<Button
						ref={setActivatorNodeRef}
						type='button'
						variant='ghost'
						size='icon-sm'
						className='touch-none cursor-grab active:cursor-grabbing'
						disabled={sortingDisabled}
						{...attributes}
						{...listeners}
						aria-label={`Переместить колонку «${props.column.title}»`}
						aria-describedby={instructionsId}
						aria-roledescription='колонка'
					>
						<GripVertical aria-hidden='true' />
					</Button>
				}
			/>
		</div>
	)
}
