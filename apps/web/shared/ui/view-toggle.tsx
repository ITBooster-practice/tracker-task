'use client'

import { cn } from '@repo/ui'
import { LayoutGrid, LayoutList } from '@repo/ui/icons'

export type ViewMode = 'list' | 'grid'

interface Props {
	view: ViewMode
	onChange: (view: ViewMode) => void
}

function ViewToggle({ view, onChange }: Props) {
	return (
		<div className='flex items-center rounded-[var(--radius-control)] border border-border p-0.5'>
			<button
				type='button'
				aria-label='Список'
				aria-pressed={view === 'list'}
				onClick={() => onChange('list')}
				className={cn(
					'flex size-8 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] transition-colors hover:bg-accent',
					view === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground',
				)}
			>
				<LayoutList className='size-4' />
			</button>
			<button
				type='button'
				aria-label='Сетка'
				aria-pressed={view === 'grid'}
				onClick={() => onChange('grid')}
				className={cn(
					'flex size-8 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] transition-colors hover:bg-accent',
					view === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground',
				)}
			>
				<LayoutGrid className='size-4' />
			</button>
		</div>
	)
}

export { ViewToggle }
