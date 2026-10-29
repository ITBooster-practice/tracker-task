import '@/test/mocks/views/boards/board-task-form-dialog.mock'

import {
	createBoardColumnFixture,
	createBoardColumnsFixture,
	createBoardTaskFixture,
} from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { BoardAssignee, BoardTaskFormValues } from '@/views/boards/model/types'
import { BoardTaskFormDialog } from '@/views/boards/ui/board-task-form-dialog'

const assignees: BoardAssignee[] = [
	{ id: 'alexey', name: 'Алексей Морозов', initials: 'AM' },
	{ id: 'anna', name: 'Анна Ким', initials: 'AK' },
]

const columns = [
	...createBoardColumnsFixture(),
	createBoardColumnFixture({
		id: 'IN_REVIEW',
		key: 'IN_REVIEW',
		title: 'На ревью',
		tasks: [],
	}),
]

describe('BoardTaskFormDialog', () => {
	afterEach(cleanup)

	it('редактирует неназначенную API-задачу с пустым описанием в произвольной колонке', () => {
		let submitted: BoardTaskFormValues | undefined
		const task = createBoardTaskFixture({
			boardColumnId: 'column:custom',
			description: null,
			dueDate: null,
			assignee: null,
			assigneeId: null,
		})
		render(
			<BoardTaskFormDialog
				open
				mode='edit'
				task={task}
				assignees={[]}
				columns={[{ id: 'column:custom', key: 'EXTERNAL', title: 'Ожидание' }]}
				onOpenChange={() => undefined}
				onSubmit={(values) => {
					submitted = values
				}}
			/>,
		)
		expect(screen.getByTestId('select-item-column:custom').textContent).toBe('Ожидание')
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		expect(submitted).toMatchObject({
			boardColumnId: 'column:custom',
			description: '',
			dueDate: '',
			assigneeId: '',
		})
	})

	it('не рендерится когда open=false', () => {
		render(
			<BoardTaskFormDialog
				columns={columns}
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
				columns={columns}
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
		fireEvent.click(screen.getByTestId('select-__unassigned__-change'))
		fireEvent.change(screen.getByLabelText('Дедлайн'), {
			target: { value: '2026-05-10' },
		})
		fireEvent.change(screen.getByLabelText('Теги'), {
			target: { value: ' ui, board,,tests ' },
		})
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)

		expect(submittedValues).toEqual({
			title: 'Новая задача',
			type: 'TASK',
			description: 'Описание задачи',
			boardColumnId: 'IN_REVIEW',
			priority: 'HIGH',
			assigneeId: 'anna',
			dueDate: '2026-05-10',
			tags: ['ui', 'board', 'tests'],
		})
	})

	it('редактирует задачу из начальных значений и закрывается по отмене', () => {
		let submittedValues: BoardTaskFormValues | null = null
		let isOpen = true

		render(
			<BoardTaskFormDialog
				columns={columns}
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

	it('сохраняет черновик при обновлении участников и доски, показывает ошибку и блокирует повторную отправку', () => {
		let submitCalls = 0
		let closeCalls = 0
		const props = {
			open: true,
			mode: 'create' as const,
			task: null,
			columns,
			assignees: [],
			showTags: false,
			onOpenChange: () => {
				closeCalls += 1
			},
			onSubmit: () => {
				submitCalls += 1
			},
		}
		const { rerender } = render(<BoardTaskFormDialog {...props} />)
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Мой черновик' },
		})
		rerender(
			<BoardTaskFormDialog
				{...props}
				columns={[...columns]}
				assignees={assignees}
				error='Сервер недоступен'
			/>,
		)
		expect(screen.getByDisplayValue('Мой черновик')).toBeDefined()
		expect(screen.getByRole('alert').textContent).toBe('Сервер недоступен')
		expect(screen.queryByLabelText('Теги')).toBeNull()
		rerender(<BoardTaskFormDialog {...props} isPending />)
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		fireEvent.click(screen.getByTestId('close-form'))
		expect(screen.getByRole('button', { name: 'Сохраняем…' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(submitCalls).toBe(0)
		expect(closeCalls).toBe(0)
		rerender(<BoardTaskFormDialog {...props} open={false} />)
		rerender(<BoardTaskFormDialog {...props} />)
		expect(screen.getByLabelText('Название')).toHaveProperty('value', '')
	})

	it('не отправляет форму без обязательных полей', () => {
		let submitCalls = 0

		render(
			<BoardTaskFormDialog
				columns={columns}
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
