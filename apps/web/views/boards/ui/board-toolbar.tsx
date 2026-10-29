import { useId, type Ref } from 'react'

import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { Search, X } from '@repo/ui/icons'

import {
	BOARD_FILTER_ALL,
	BOARD_PRIORITY_LABELS,
	BOARD_TYPE_OPTIONS,
} from '../model/constants'
import {
	hasProjectBoardFilters,
	type BoardPriorityFilter,
	type ProjectBoardFilters,
} from '../model/project-board-filters'
import type { BoardTypeFilter } from '../model/types'

interface BoardToolbarProps {
	filters: ProjectBoardFilters
	assigneeOptions: Array<{ label: string; value: string }>
	onChange: (patch: Partial<ProjectBoardFilters>, replace?: boolean) => void
	onReset: () => void
	searchRef?: Ref<HTMLInputElement>
	assigneesPending?: boolean
	assigneesError?: boolean
	onRetryAssignees?: () => void
}

export function BoardToolbar({
	filters,
	assigneeOptions,
	onChange,
	onReset,
	searchRef,
	assigneesPending,
	assigneesError,
	onRetryAssignees,
}: BoardToolbarProps) {
	const id = useId()
	return (
		<section aria-label='Фильтры доски' className='space-y-3'>
			<div className='grid grid-cols-2 items-end gap-4 xl:grid-cols-[minmax(200px,1fr)_minmax(160px,220px)_minmax(140px,200px)_minmax(140px,200px)_auto]'>
				<div className='col-span-2 min-w-0 space-y-2 xl:col-span-1'>
					<Label htmlFor={`${id}-query`}>Поиск задач</Label>
					<div className='relative min-w-0'>
						<Search
							aria-hidden='true'
							className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
						/>
						<Input
							ref={searchRef}
							id={`${id}-query`}
							value={filters.query}
							onChange={(event) => onChange({ query: event.target.value }, true)}
							placeholder='Название или ключ'
							className='pl-9'
						/>
					</div>
				</div>
				<div className='min-w-0 space-y-2'>
					<Label htmlFor={`${id}-assignee`}>Исполнитель</Label>
					<Select
						name='Исполнитель'
						value={filters.assignee}
						onValueChange={(assignee) => onChange({ assignee })}
					>
						<SelectTrigger id={`${id}-assignee`} className='w-full min-w-0'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{assigneeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='min-w-0 space-y-2'>
					<Label htmlFor={`${id}-priority`}>Приоритет</Label>
					<Select
						name='Приоритет'
						value={filters.priority}
						onValueChange={(priority) =>
							onChange({ priority: priority as BoardPriorityFilter })
						}
					>
						<SelectTrigger id={`${id}-priority`} className='w-full min-w-0'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={BOARD_FILTER_ALL}>Все приоритеты</SelectItem>
							{Object.entries(BOARD_PRIORITY_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='min-w-0 space-y-2'>
					<Label htmlFor={`${id}-type`}>Тип задачи</Label>
					<Select
						name='Тип задачи'
						value={filters.type}
						onValueChange={(type) => onChange({ type: type as BoardTypeFilter })}
					>
						<SelectTrigger id={`${id}-type`} className='w-full min-w-0'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{BOARD_TYPE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					type='button'
					variant='outline'
					onClick={onReset}
					disabled={!hasProjectBoardFilters(filters)}
					className='col-span-2 justify-self-start xl:col-span-1'
				>
					<X aria-hidden='true' />
					Сбросить фильтры
				</Button>
			</div>
			{assigneesPending && (
				<p role='status' className='text-sm text-muted-foreground'>
					Загружаем исполнителей…
				</p>
			)}
			{assigneesError && (
				<div
					className='flex flex-wrap items-center gap-2 text-sm text-destructive'
					role='alert'
				>
					<p>Не удалось загрузить список исполнителей.</p>
					<Button type='button' variant='outline' size='sm' onClick={onRetryAssignees}>
						Повторить
					</Button>
				</div>
			)}
		</section>
	)
}
