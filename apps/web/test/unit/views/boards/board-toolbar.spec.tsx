import '@/test/mocks/views/boards/board-toolbar.mock'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { emptyProjectBoardFilters } from '@/views/boards/model/project-board-filters'
import { BoardToolbar } from '@/views/boards/ui/board-toolbar'

const assigneeOptions = [
	{ label: 'Все исполнители', value: 'ALL' },
	{ label: 'Без исполнителя', value: 'UNASSIGNED' },
	{ label: 'Анна', value: 'anna' },
]
afterEach(cleanup)
it('показывает связанные подписи полей и блокирует сброс без фильтров', () => {
	render(
		<BoardToolbar
			filters={emptyProjectBoardFilters}
			assigneeOptions={assigneeOptions}
			onChange={() => undefined}
			onReset={() => undefined}
		/>,
	)
	expect(screen.getByLabelText('Поиск задач')).toHaveProperty('value', '')
	for (const name of ['Исполнитель', 'Приоритет', 'Тип задачи'])
		expect(screen.getByRole('combobox', { name })).toHaveProperty('value', 'ALL')
	expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toHaveProperty(
		'disabled',
		true,
	)
})
it('передаёт изменения поиска, всех фильтров и сброс', () => {
	const change = vi.fn(),
		reset = vi.fn()
	render(
		<BoardToolbar
			filters={{ ...emptyProjectBoardFilters, priority: 'HIGH' }}
			assigneeOptions={assigneeOptions}
			onChange={change}
			onReset={reset}
		/>,
	)
	fireEvent.change(screen.getByLabelText('Поиск задач'), { target: { value: 'TT-1' } })
	fireEvent.change(screen.getByRole('combobox', { name: 'Приоритет' }), {
		target: { value: 'LOW' },
	})
	fireEvent.change(screen.getByRole('combobox', { name: 'Тип задачи' }), {
		target: { value: 'BUG' },
	})
	fireEvent.change(screen.getByRole('combobox', { name: 'Исполнитель' }), {
		target: { value: 'anna' },
	})
	expect(change.mock.calls).toEqual([
		[{ query: 'TT-1' }, true],
		[{ priority: 'LOW' }],
		[{ type: 'BUG' }],
		[{ assignee: 'anna' }],
	])
	fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
	expect(reset).toHaveBeenCalledTimes(1)
})
it('объясняет загрузку и ошибку исполнителей и позволяет повторить', () => {
	const retry = vi.fn()
	const props = {
		filters: emptyProjectBoardFilters,
		assigneeOptions,
		onChange: () => undefined,
		onReset: () => undefined,
		onRetryAssignees: retry,
	}
	const { rerender } = render(<BoardToolbar {...props} assigneesPending />)
	expect(screen.getByRole('status').textContent).toContain('Загружаем исполнителей')
	rerender(<BoardToolbar {...props} assigneesError />)
	expect(screen.getByRole('alert').textContent).toContain('Не удалось')
	fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
	expect(retry).toHaveBeenCalledTimes(1)
})
