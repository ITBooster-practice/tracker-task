import { useId, useState, type Ref } from 'react'

import {
	Button,
	ChoiceGroup,
	ChoiceGroupItem,
	cn,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
} from '@repo/ui'
import {
	CalendarClock,
	ChevronDown,
	Search,
	SlidersHorizontal,
	UserRound,
	UserRoundX,
	X,
} from '@repo/ui/icons'

import type { BoardGrouping } from '../model/board-swimlanes'
import {
	BOARD_FILTER_ALL,
	BOARD_PRIORITY_LABELS,
	BOARD_TYPE_OPTIONS,
} from '../model/constants'
import {
	BOARD_UNASSIGNED,
	hasProjectBoardFilters,
	type BoardPriorityFilter,
	type ProjectBoardFilters,
} from '../model/project-board-filters'
import { formatBoardTaskCount } from '../model/task-count'
import type { BoardTypeFilter } from '../model/types'

interface BoardToolbarProps {
	grouping: BoardGrouping
	onGroupingChange: (value: BoardGrouping) => void
	filters: ProjectBoardFilters
	assigneeOptions: Array<{ label: string; value: string }>
	onChange: (patch: Partial<ProjectBoardFilters>, replace?: boolean) => void
	onReset: () => void
	searchRef?: Ref<HTMLInputElement>
	assigneesPending?: boolean
	assigneesError?: boolean
	onRetryAssignees?: () => void
	currentUserId?: string
	totalTasks?: number
	visibleTasks?: number
}

export function BoardToolbar({
	grouping,
	onGroupingChange,
	filters,
	assigneeOptions,
	onChange,
	onReset,
	searchRef,
	assigneesPending,
	assigneesError,
	onRetryAssignees,
	currentUserId,
	totalTasks = 0,
	visibleTasks = 0,
}: BoardToolbarProps) {
	const id = useId()
	const [expanded, setExpanded] = useState(false)
	const chips: Array<{ label: string; clear: Partial<ProjectBoardFilters> }> = []
	if (filters.type !== BOARD_FILTER_ALL)
		chips.push({
			label: BOARD_TYPE_OPTIONS.find((option) => option.value === filters.type)!.label,
			clear: { type: BOARD_FILTER_ALL },
		})
	if (filters.priority !== BOARD_FILTER_ALL)
		chips.push({
			label: BOARD_PRIORITY_LABELS[filters.priority],
			clear: { priority: BOARD_FILTER_ALL },
		})
	if (filters.assignee !== BOARD_FILTER_ALL)
		chips.push({
			label:
				filters.assignee === currentUserId
					? 'Только мои'
					: (assigneeOptions.find((option) => option.value === filters.assignee)?.label ??
						'Участник недоступен'),
			clear: { assignee: BOARD_FILTER_ALL },
		})
	if (filters.overdue) chips.push({ label: 'Просроченные', clear: { overdue: false } })
	const activeClass =
		'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:border-primary dark:bg-primary/10 dark:hover:bg-primary/15'
	return (
		<section aria-label='Фильтры доски' className='shrink-0 space-y-4'>
			<Collapsible open={expanded} onOpenChange={setExpanded}>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='relative w-full min-w-0 xl:max-w-[440px]'>
						<label className='sr-only' htmlFor={`${id}-query`}>
							Поиск задач
						</label>
						<Search
							aria-hidden
							className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
						/>
						<Input
							ref={searchRef}
							id={`${id}-query`}
							value={filters.query}
							onChange={(event) => onChange({ query: event.target.value }, true)}
							placeholder='Поиск по названию, коду или метке'
							className='bg-card pl-9'
						/>
					</div>
					<div className='flex flex-wrap gap-2'>
						<CollapsibleTrigger asChild>
							<Button
								type='button'
								variant='outline'
								className={cn(
									'font-semibold active:border-primary active:bg-primary/15 active:text-primary dark:active:border-primary dark:active:bg-primary/15',
									(expanded || chips.length > 0) && activeClass,
								)}
							>
								<SlidersHorizontal aria-hidden />
								{expanded ? 'Скрыть фильтры' : 'Фильтры'}
								{chips.length > 0 && ` · ${chips.length}`}
								<ChevronDown aria-hidden className={expanded ? 'rotate-180' : ''} />
							</Button>
						</CollapsibleTrigger>
						<Button
							type='button'
							variant='outline'
							disabled={!currentUserId}
							aria-pressed={Boolean(currentUserId && filters.assignee === currentUserId)}
							className={
								currentUserId && filters.assignee === currentUserId ? activeClass : ''
							}
							onClick={() =>
								onChange({
									assignee:
										filters.assignee === currentUserId
											? BOARD_FILTER_ALL
											: currentUserId!,
								})
							}
						>
							<UserRound aria-hidden />
							Только мои
						</Button>
						<Button
							type='button'
							variant='outline'
							aria-pressed={filters.assignee === BOARD_UNASSIGNED}
							className={filters.assignee === BOARD_UNASSIGNED ? activeClass : ''}
							onClick={() =>
								onChange({
									assignee:
										filters.assignee === BOARD_UNASSIGNED
											? BOARD_FILTER_ALL
											: BOARD_UNASSIGNED,
								})
							}
						>
							<UserRoundX aria-hidden />
							Без исполнителя
						</Button>
						<Button
							type='button'
							variant='outline'
							aria-pressed={Boolean(filters.overdue)}
							className={filters.overdue ? activeClass : ''}
							onClick={() => onChange({ overdue: !filters.overdue })}
						>
							<CalendarClock aria-hidden />
							Просроченные
						</Button>
					</div>
				</div>
				<CollapsibleContent inert={!expanded} aria-hidden={!expanded} className='pt-4'>
					<div className='space-y-3 rounded-[var(--radius-control)] border border-border bg-card/60 p-4'>
						<div className='flex flex-col gap-2 sm:flex-row sm:items-start'>
							<span className='shrink-0 pt-2 text-sm text-muted-foreground sm:w-28'>
								Тип задачи
							</span>
							<ChoiceGroup
								aria-label='Тип задачи'
								disabled={!expanded}
								value={filters.type}
								onValueChange={(value) => onChange({ type: value as BoardTypeFilter })}
							>
								{BOARD_TYPE_OPTIONS.map((option) => (
									<ChoiceGroupItem key={option.value} value={option.value}>
										{option.label}
									</ChoiceGroupItem>
								))}
							</ChoiceGroup>
						</div>
						<div className='flex flex-col gap-2 sm:flex-row sm:items-start'>
							<span className='shrink-0 pt-2 text-sm text-muted-foreground sm:w-28'>
								Приоритет
							</span>
							<ChoiceGroup
								aria-label='Приоритет'
								disabled={!expanded}
								value={filters.priority}
								onValueChange={(value) =>
									onChange({ priority: value as BoardPriorityFilter })
								}
							>
								<ChoiceGroupItem value={BOARD_FILTER_ALL}>Любой</ChoiceGroupItem>
								{Object.entries(BOARD_PRIORITY_LABELS).map(([value, label]) => (
									<ChoiceGroupItem key={value} value={value}>
										{label}
									</ChoiceGroupItem>
								))}
							</ChoiceGroup>
						</div>
						<div className='flex flex-col gap-2 sm:flex-row sm:items-start'>
							<span className='shrink-0 pt-2 text-sm text-muted-foreground sm:w-28'>
								Исполнитель
							</span>
							<ChoiceGroup
								aria-label='Исполнитель'
								disabled={!expanded}
								value={filters.assignee}
								onValueChange={(assignee) => onChange({ assignee })}
							>
								{assigneeOptions.map((option) => (
									<ChoiceGroupItem key={option.value} value={option.value}>
										{option.value === BOARD_FILTER_ALL ? 'Все участники' : option.label}
									</ChoiceGroupItem>
								))}
							</ChoiceGroup>
						</div>
						{assigneesPending && (
							<p role='status' className='text-sm text-muted-foreground'>
								Загружаем исполнителей…
							</p>
						)}
						{assigneesError && (
							<div
								role='alert'
								className='flex flex-wrap items-center gap-2 text-sm text-destructive'
							>
								<p>Не удалось загрузить список исполнителей.</p>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={onRetryAssignees}
								>
									Повторить
								</Button>
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
			{chips.length > 0 && (
				<div aria-label='Активные фильтры' className='flex flex-wrap items-center gap-2'>
					{chips.map((chip) => (
						<Button
							key={chip.label}
							type='button'
							variant='outline'
							className='max-w-full text-primary'
							aria-label={`Снять фильтр: ${chip.label}`}
							onClick={() => onChange(chip.clear)}
						>
							<span className='truncate'>{chip.label}</span>
							<X aria-hidden />
						</Button>
					))}
					<Button type='button' variant='ghost' onClick={onReset}>
						Сбросить всё
					</Button>
				</div>
			)}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<p role='status' aria-live='polite' className='text-sm text-muted-foreground'>
					{totalTasks === 0
						? 'На доске нет задач'
						: hasProjectBoardFilters(filters)
							? `Показано ${visibleTasks} из ${formatBoardTaskCount(totalTasks, 'genitive')}`
							: totalTasks === 1
								? 'Показана 1 задача'
								: `Показаны все ${formatBoardTaskCount(totalTasks)}`}
				</p>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Группировка:</span>
					<ChoiceGroup
						aria-label='Группировка'
						value={grouping}
						onValueChange={(value) => onGroupingChange(value as BoardGrouping)}
					>
						{[
							['none', 'Без группировки'],
							['priority', 'По приоритету'],
							['assignee', 'По исполнителю'],
						].map(([value, label]) => (
							<ChoiceGroupItem key={value} value={value!}>
								{label}
							</ChoiceGroupItem>
						))}
					</ChoiceGroup>
				</div>
			</div>
		</section>
	)
}
