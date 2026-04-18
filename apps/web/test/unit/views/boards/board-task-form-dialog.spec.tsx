import '@/test/mocks/views/boards/board-task-form-dialog.mock'

import { createBoardTaskFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { BoardAssignee, BoardTaskFormValues } from '@/views/boards/model/types'
import { BoardTaskFormDialog } from '@/views/boards/ui/board-task-form-dialog'

const assignees: BoardAssignee[] = [
	{ id: 'alexey', name: 'Алексей Морозов', initials: 'AM' },
	{ id: 'anna', name: 'Анна Ким', initials: 'AK' },
]

describe('BoardTaskFormDialog', () => {
	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(
			<BoardTaskFormDialog
				open={false}
				mode='create'
				task={null}
				assignees={assignees}
				onOpenChange={() => undefined}
				onSubmit={() => undefined}
			/>,
		)

		expect(screen.queryByTestId('task-form-dialog')).toBeNull()
	})

	it('создаёт задачу с нормализованными полями формы', () => {
		let submittedValues: BoardTaskFormValues | null = null

		render(
			<BoardTaskFormDialog
				open
				mode='create'
				task={null}
				assignees={assignees}
				onOpenChange={() => undefined}
				onSubmit={(values) => {
					submittedValues = values
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: '  Новая задача  ' },
		})
		fireEvent.change(screen.getByLabelText('Описание'), {
			target: { value: '  Описание задачи  ' },
		})
		fireEvent.click(screen.getByTestId('select-TODO-change'))
		fireEvent.click(screen.getByTestId('select-MEDIUM-change'))
		fireEvent.click(screen.getByTestId('select-alexey-change'))
		fireEvent.change(screen.getByLabelText('Дедлайн'), {
			target: { value: '2026-05-10' },
		})
		fireEvent.change(screen.getByLabelText('Теги'), {
			target: { value: ' ui, board,,tests ' },
		})
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)

		expect(submittedValues).toEqual({
			title: 'Новая задача',
			description: 'Описание задачи',
			columnId: 'IN_REVIEW',
			priority: 'HIGH',
			assigneeId: 'anna',
			deadline: '2026-05-10',
			tags: ['ui', 'board', 'tests'],
		})
	})

	it('редактирует задачу из начальных значений и закрывается по отмене', () => {
		let submittedValues: BoardTaskFormValues | null = null
		let isOpen = true

		render(
			<BoardTaskFormDialog
				open
				mode='edit'
				task={createBoardTaskFixture()}
				assignees={assignees}
				onOpenChange={(open) => {
					isOpen = open
				}}
				onSubmit={(values) => {
					submittedValues = values
				}}
			/>,
		)

		expect(screen.getByDisplayValue('Проверить карточку задачи')).toBeDefined()
		expect(
			screen.getByDisplayValue('Описание задачи для unit-теста board UI.'),
		).toBeDefined()
		expect(screen.getByDisplayValue('2026-05-01')).toBeDefined()
		expect(screen.getByDisplayValue('ui, tests')).toBeDefined()

		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Обновлённая задача' },
		})
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)

		expect(submittedValues).toMatchObject({
			title: 'Обновлённая задача',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(isOpen).toBe(false)
	})

	it('не отправляет форму без обязательных полей', () => {
		let submitCalls = 0

		render(
			<BoardTaskFormDialog
				open
				mode='create'
				task={null}
				assignees={assignees}
				onOpenChange={() => undefined}
				onSubmit={() => {
					submitCalls += 1
				}}
			/>,
		)

		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)

		expect(submitCalls).toBe(0)
		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
	})
})
