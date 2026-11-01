import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { emptyProjectBoardFilters } from '@/views/boards/model/project-board-filters'
import { BoardToolbar } from '@/views/boards/ui/board-toolbar'

afterEach(cleanup)
const props = {
	grouping: 'none' as const,
	onGroupingChange: vi.fn(),
	filters: emptyProjectBoardFilters,
	assigneeOptions: [
		{ label: 'Все исполнители', value: 'ALL' },
		{ label: 'Без исполнителя', value: 'UNASSIGNED' },
		{ label: 'Анна', value: 'anna' },
	],
	onChange: vi.fn(),
	onReset: vi.fn(),
	currentUserId: 'anna',
	totalTasks: 4,
	visibleTasks: 4,
}

it('раскрытие панели сохраняет условия и оставляет снимаемые фильтры видимыми', () => {
	const change = vi.fn()
	render(
		<BoardToolbar
			{...props}
			filters={{ ...emptyProjectBoardFilters, type: 'BUG', priority: 'HIGH' }}
			onChange={change}
		/>,
	)
	expect(screen.queryByRole('radiogroup', { name: 'Тип задачи' })).toBeNull()
	expect(screen.getByRole('button', { name: /Снять фильтр: Баг/ })).toBeDefined()
	fireEvent.click(screen.getByRole('button', { name: 'Фильтры · 2', expanded: false }))
	expect(
		screen.getByRole('button', { name: 'Скрыть фильтры · 2', expanded: true }),
	).toBeDefined()
	expect(screen.getByRole('radiogroup', { name: 'Тип задачи' })).toBeDefined()
	fireEvent.click(
		within(screen.getByRole('radiogroup', { name: 'Приоритет' })).getByRole('radio', {
			name: 'Низкий',
		}),
	)
	expect(change).toHaveBeenCalledWith({ priority: 'LOW' })
	fireEvent.click(screen.getByRole('button', { name: 'Скрыть фильтры · 2' }))
	expect(
		screen.getByRole('button', { name: 'Фильтры · 2', expanded: false }),
	).toBeDefined()
	expect(screen.getByRole('button', { name: /Снять фильтр: Баг/ })).toBeDefined()
})

it('быстрые условия и группировка изменяют независимые параметры', () => {
	const change = vi.fn(),
		group = vi.fn()
	render(<BoardToolbar {...props} onChange={change} onGroupingChange={group} />)
	fireEvent.click(screen.getByRole('button', { name: 'Только мои' }))
	fireEvent.click(screen.getByRole('button', { name: 'Без исполнителя' }))
	fireEvent.click(screen.getByRole('button', { name: 'Просроченные' }))
	expect(change.mock.calls).toEqual([
		[{ assignee: 'anna' }],
		[{ assignee: 'UNASSIGNED' }],
		[{ overdue: true }],
	])
	fireEvent.click(screen.getByRole('radio', { name: 'По исполнителю' }))
	expect(group).toHaveBeenCalledWith('assignee')
})

it('передаёт поиск, снимает одно условие и сбрасывает все условия', () => {
	const change = vi.fn(),
		reset = vi.fn()
	render(
		<BoardToolbar
			{...props}
			filters={{ ...emptyProjectBoardFilters, assignee: 'anna' }}
			onChange={change}
			onReset={reset}
		/>,
	)
	fireEvent.change(screen.getByLabelText('Поиск задач'), { target: { value: 'TT-1' } })
	expect(change).toHaveBeenCalledWith({ query: 'TT-1' }, true)
	fireEvent.click(screen.getByRole('button', { name: 'Снять фильтр: Только мои' }))
	expect(change).toHaveBeenCalledWith({ assignee: 'ALL' })
	fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }))
	expect(reset).toHaveBeenCalledOnce()
})

it('показывает ошибку списка исполнителей и повторяет запрос', () => {
	const retry = vi.fn()
	render(<BoardToolbar {...props} assigneesError onRetryAssignees={retry} />)
	fireEvent.click(screen.getByRole('button', { name: /^Фильтры/ }))
	expect(screen.getByRole('alert').textContent).toContain('Не удалось')
	fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
	expect(retry).toHaveBeenCalledOnce()
})
