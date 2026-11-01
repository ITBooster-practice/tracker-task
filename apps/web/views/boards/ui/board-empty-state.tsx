import { Button, EmptyState } from '@repo/ui'
import { Inbox, Plus, Search, SlidersHorizontal, X } from '@repo/ui/icons'

import {
	BOARD_FILTER_ALL,
	BOARD_PRIORITY_LABELS,
	BOARD_TYPE_OPTIONS,
} from '../model/constants'
import {
	hasProjectBoardFilters,
	type ProjectBoardFilters,
} from '../model/project-board-filters'
import { formatBoardTaskCount } from '../model/task-count'

interface BoardEmptyStateProps {
	totalTasks: number
	filters: ProjectBoardFilters
	assigneeOptions: Array<{ value: string; label: string }>
	onCreateTask: () => void
	onClearSearch: () => void
	onResetFilters: () => void
	disabled?: boolean
}

export function BoardEmptyState({
	totalTasks,
	filters,
	assigneeOptions,
	onCreateTask,
	onClearSearch,
	onResetFilters,
	disabled = false,
}: BoardEmptyStateProps) {
	const emptyBoard = totalTasks === 0
	const query = filters.query.trim()
	const searchEmpty = !emptyBoard && query.length > 0
	const otherFilters = hasProjectBoardFilters({ ...filters, query: '' })
	const conditions: string[] = []
	if (filters.type !== BOARD_FILTER_ALL)
		conditions.push(
			BOARD_TYPE_OPTIONS.find((option) => option.value === filters.type)!.label,
		)
	if (filters.priority !== BOARD_FILTER_ALL)
		conditions.push(`${BOARD_PRIORITY_LABELS[filters.priority]} приоритет`)
	if (filters.assignee !== BOARD_FILTER_ALL)
		conditions.push(
			assigneeOptions.find((option) => option.value === filters.assignee)?.label ??
				'Исполнитель недоступен',
		)
	if (filters.overdue) conditions.push('Просроченные')
	const conditionText = new Intl.ListFormat('ru-RU', { type: 'conjunction' }).format(
		conditions.map((label) => `«${label}»`),
	)
	const title = emptyBoard
		? 'На доске пока нет задач'
		: searchEmpty
			? 'Ничего не найдено'
			: 'Нет задач с такими фильтрами'
	const description = emptyBoard
		? 'Создайте первую задачу — колонки уже готовы к работе. Задачи появятся здесь по мере добавления.'
		: searchEmpty
			? `По запросу «${query}»${otherFilters ? ' с текущими фильтрами' : ''} задач нет. Проверьте название, код задачи или метку либо очистите поиск.`
			: `На доске есть ${formatBoardTaskCount(totalTasks)}, но ни одна не соответствует ${conditions.length === 1 ? 'условию' : 'условиям'} ${conditionText}.`
	const Icon = emptyBoard ? Inbox : searchEmpty ? Search : SlidersHorizontal
	return (
		<EmptyState
			headingLevel='h2'
			className='mx-auto max-w-[560px] rounded-none border-0 p-0 [&>div:nth-child(2)]:space-y-4 [&_h2]:leading-8 [&_p]:text-base [&_p]:leading-6 [&_p]:wrap-anywhere'
			icon={<Icon aria-hidden className='size-6' />}
			title={title}
			description={description}
			aria-live='polite'
			aria-atomic='true'
			action={
				<Button
					type='button'
					variant={emptyBoard ? 'default' : 'outline'}
					disabled={disabled}
					onClick={
						emptyBoard ? onCreateTask : searchEmpty ? onClearSearch : onResetFilters
					}
				>
					{emptyBoard ? <Plus aria-hidden /> : <X aria-hidden />}
					{emptyBoard
						? 'Создать первую задачу'
						: searchEmpty
							? 'Очистить поиск'
							: 'Сбросить фильтры'}
				</Button>
			}
		/>
	)
}
