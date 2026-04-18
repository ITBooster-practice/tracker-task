import {
	Button,
	cn,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { Search, X } from '@repo/ui/icons'

import type { BoardAssigneeFilter, BoardTypeFilter } from '../model/types'

interface BoardToolbarProps {
	query: string
	type: BoardTypeFilter
	assignee: BoardAssigneeFilter
	typeOptions: Array<{
		label: string
		value: BoardTypeFilter
	}>
	assigneeOptions: Array<{
		label: string
		value: BoardAssigneeFilter
	}>
	hasActiveFilters: boolean
	onQueryChange: (value: string) => void
	onTypeChange: (value: BoardTypeFilter) => void
	onAssigneeChange: (value: BoardAssigneeFilter) => void
	onReset: () => void
}

function BoardToolbar({
	query,
	type,
	assignee,
	typeOptions,
	assigneeOptions,
	hasActiveFilters,
	onQueryChange,
	onTypeChange,
	onAssigneeChange,
	onReset,
}: BoardToolbarProps) {
	return (
		<div className='grid gap-2 md:grid-cols-[minmax(200px,280px)_160px_160px_auto]'>
			<div className='relative min-w-0'>
				<Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
				<Input
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder='Поиск по названию, ключу или тегу'
					className='h-8 pl-9 text-[12px]'
				/>
			</div>

			<Select
				value={type}
				onValueChange={(value) => onTypeChange(value as BoardTypeFilter)}
			>
				<SelectTrigger size='sm' className='h-8 bg-background text-[12px]'>
					<SelectValue placeholder='Все типы' />
				</SelectTrigger>
				<SelectContent className='border-border bg-popover'>
					{typeOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={assignee}
				onValueChange={(value) => onAssigneeChange(value as BoardAssigneeFilter)}
			>
				<SelectTrigger size='sm' className='h-8 bg-background text-[12px]'>
					<SelectValue placeholder='Все исполнители' />
				</SelectTrigger>
				<SelectContent className='border-border bg-popover'>
					{assigneeOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Button
				type='button'
				variant='outline'
				size='sm'
				onClick={onReset}
				disabled={!hasActiveFilters}
				className={cn('h-8 gap-2 bg-background px-3 text-[12px]')}
			>
				<X className='size-3.5' />
				Сбросить
			</Button>
		</div>
	)
}

export { BoardToolbar }
