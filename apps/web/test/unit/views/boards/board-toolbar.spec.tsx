import '@/test/mocks/views/boards/board-toolbar.mock'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { BoardAssigneeFilter, BoardTypeFilter } from '@/views/boards/model/types'
import { BoardToolbar } from '@/views/boards/ui/board-toolbar'

const typeOptions: Array<{ label: string; value: BoardTypeFilter }> = [
	{ label: 'Все типы', value: 'ALL' },
	{ label: 'Баги', value: 'Баг' },
	{ label: 'Задачи', value: 'Задача' },
]

const assigneeOptions: Array<{ label: string; value: BoardAssigneeFilter }> = [
	{ label: 'Все исполнители', value: 'ALL' },
	{ label: 'Анна Ким', value: 'anna' },
	{ label: 'Алексей Морозов', value: 'alexey' },
]

describe('BoardToolbar', () => {
	afterEach(cleanup)

	it('рендерит поиск, фильтры и disabled reset без активных фильтров', () => {
		render(
			<BoardToolbar
				query=''
				type='ALL'
				assignee='ALL'
				typeOptions={typeOptions}
				assigneeOptions={assigneeOptions}
				hasActiveFilters={false}
				onQueryChange={() => undefined}
				onTypeChange={() => undefined}
				onAssigneeChange={() => undefined}
				onReset={() => undefined}
			/>,
		)

		expect(screen.getByTestId('icon-search')).toBeDefined()
		expect(screen.getByPlaceholderText('Поиск по названию, ключу или тегу')).toBeDefined()
		expect(screen.getByTestId('select-item-Баг')).toBeDefined()
		expect(screen.getByTestId('select-item-anna')).toBeDefined()
		expect(screen.getByRole('button', { name: /Сбросить/ })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('вызывает callbacks поиска, фильтров и сброса', () => {
		let queryValue = ''
		let typeValue = ''
		let assigneeValue = ''
		let resetCalls = 0

		render(
			<BoardToolbar
				query='старый'
				type='Баг'
				assignee='anna'
				typeOptions={typeOptions}
				assigneeOptions={assigneeOptions}
				hasActiveFilters
				onQueryChange={(value) => {
					queryValue = value
				}}
				onTypeChange={(value) => {
					typeValue = value
				}}
				onAssigneeChange={(value) => {
					assigneeValue = value
				}}
				onReset={() => {
					resetCalls += 1
				}}
			/>,
		)

		fireEvent.change(screen.getByPlaceholderText('Поиск по названию, ключу или тегу'), {
			target: { value: 'drag preview' },
		})
		fireEvent.click(screen.getByTestId('select-Баг-change'))
		fireEvent.click(screen.getByTestId('select-anna-change'))
		fireEvent.click(screen.getByRole('button', { name: /Сбросить/ }))

		expect(queryValue).toBe('drag preview')
		expect(typeValue).toBe('Задача')
		expect(assigneeValue).toBe('alexey')
		expect(resetCalls).toBe(1)
	})
})
