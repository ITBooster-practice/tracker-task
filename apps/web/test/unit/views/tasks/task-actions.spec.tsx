import '@/test/mocks/api/tasks-service.mock'
import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem, Task } from '@repo/types'

import { TaskDetailsDialog, TaskEditDialog } from '@/features/tasks'
import { boardsKeys } from '@/shared/api/use-boards'
import { tasksKeys } from '@/shared/api/use-tasks'

const { identity, success, error } = vi.hoisted(() => ({
	identity: { id: 'owner', role: 'OWNER' },
	success: vi.fn(),
	error: vi.fn(),
}))
vi.mock('@repo/ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@repo/ui')>()),
	toast: { success, error },
}))
vi.mock('@/shared/api/use-auth', () => ({ useMe: () => ({ data: { id: identity.id } }) }))
vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMemberOptions: () => ({
		data: [
			{ userId: identity.id, name: 'Текущий пользователь', role: identity.role },
			{ userId: 'assigned', name: 'Исполнитель', role: 'MEMBER' },
		],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
	}),
}))

let client: QueryClient
let current: Task
let width: number
const listeners = new Set<() => void>()
const Wrapper = ({ children }: React.PropsWithChildren) => (
	<QueryClientProvider client={client}>{children}</QueryClientProvider>
)
const onClose = vi.fn()
const taskBoard = (): BoardListItem => {
	const board = createBoardListItemFixture()
	const template = board.columns[0]!
	board.columns = [
		['backlog', 'BACKLOG', 'Бэклог'],
		['todo', 'TODO', 'К выполнению'],
		['progress', 'IN_PROGRESS', 'В работе'],
		['review', 'IN_REVIEW', 'На проверке'],
		['done', 'DONE', 'Готово'],
		['custom', 'custom_column', 'Ожидает релиза'],
	].map(([id, key, title], position) => ({
		...template,
		id: id!,
		key: key!,
		title: title!,
		position,
		isSystem: key !== 'custom_column',
	}))
	return board
}
const details = (props: Partial<ComponentProps<typeof TaskDetailsDialog>> = {}) =>
	render(
		<TaskDetailsDialog
			teamId='team-1'
			projectId='project-1'
			taskId={current.id}
			onClose={onClose}
			{...props}
		/>,
		{ wrapper: Wrapper },
	)
async function select(label: string, option: string) {
	const trigger = await screen.findByRole('combobox', { name: label })
	await waitFor(() => expect(trigger).toHaveProperty('disabled', false))
	fireEvent.keyDown(trigger, {
		key: 'ArrowDown',
	})
	fireEvent.click(await screen.findByRole('option', { name: option }))
}
async function openEdit() {
	await screen.findByRole('heading', { name: current.title })
	fireEvent.click(await screen.findByRole('button', { name: 'Редактировать задачу' }))
	await screen.findByRole('heading', { name: 'Редактировать задачу' })
}
async function saveEdit() {
	const save = screen.getByRole('button', { name: 'Сохранить изменения' })
	await waitFor(() => expect(save).toHaveProperty('disabled', false))
	fireEvent.click(save)
}

describe('shared task details and editing', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resetTasksServiceMock()
		identity.id = 'owner'
		identity.role = 'OWNER'
		width = 1280
		listeners.clear()
		onClose.mockReset()
		current = createTaskFixture({
			id: 'task-action',
			createdById: 'creator',
			title: 'Задача',
			description: 'Контекст',
			type: 'BUG',
			priority: 'HIGH',
			status: 'IN_REVIEW',
			assigneeId: 'assigned',
			dueDate: '2026-11-15T18:30:00.000Z',
			version: 7,
			boardColumnId: 'review',
		})
		client = new QueryClient({
			defaultOptions: {
				queries: { retry: false, staleTime: Infinity },
				mutations: { retry: false },
			},
		})
		tasksServiceMock.getById.mockImplementation(async () => current)
		boardsServiceMock.getAll.mockReset().mockImplementation(async () => [taskBoard()])
		tasksServiceMock.update.mockImplementation(async (_team, _project, _id, data) => {
			current = { ...current, ...data, version: current.version + 1 }
			if (data.boardColumnId) {
				const column = taskBoard().columns.find((item) => item.id === data.boardColumnId)
				if (column?.isSystem) current.status = column.key as Task['status']
			}
			return current
		})
		tasksServiceMock.delete.mockResolvedValue(undefined)
		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => ({
				matches: width >= Number(query.match(/min-width:\s*(\d+)/)?.[1] ?? Infinity),
				addEventListener: (_: string, fn: () => void) => listeners.add(fn),
				removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
			})),
		)
		Element.prototype.scrollIntoView = vi.fn()
		Element.prototype.hasPointerCapture = vi.fn(() => false)
		Element.prototype.setPointerCapture = vi.fn()
		Element.prototype.releasePointerCapture = vi.fn()
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn()
				unobserve = vi.fn()
				disconnect = vi.fn()
			},
		)
	})
	afterEach(() => {
		cleanup()
		client.clear()
		vi.unstubAllGlobals()
	})

	it('loads common details from the API with metadata and action permissions', async () => {
		current.labels = ['refactor', 'Frontend']
		details()
		await screen.findByText('Контекст')
		expect(tasksServiceMock.getById).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'task-action',
		)
		expect(screen.getByText('Контекст')).toBeDefined()
		expect(screen.getByText('refactor')).toBeDefined()
		expect(screen.getByText('Frontend')).toBeDefined()
		expect(
			within(screen.getByRole('complementary', { name: 'Свойства задачи' })).getAllByText(
				'Исполнитель',
			),
		).toHaveLength(2)
		expect(screen.getByRole('button', { name: 'Редактировать задачу' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Удалить задачу' })).toBeDefined()
		expect(screen.getAllByRole('dialog')).toHaveLength(1)
	})
	it.each([
		['viewer', 'MEMBER', false, false],
		['creator', 'MEMBER', true, false],
		['admin', 'ADMIN', true, true],
	] as const)('respects %s permissions', async (id, role, edit, remove) => {
		identity.id = id
		identity.role = role
		details()
		await screen.findByText('Контекст')
		expect(Boolean(screen.queryByRole('button', { name: 'Редактировать задачу' }))).toBe(
			edit,
		)
		expect(Boolean(screen.queryByRole('button', { name: 'Удалить задачу' }))).toBe(remove)
		expect(screen.queryAllByRole('combobox')).toHaveLength(edit ? 3 : 0)
		if (!edit) {
			const properties = within(
				screen.getByRole('complementary', { name: 'Свойства задачи' }),
			)
			expect(properties.getByText('Баг')).toBeDefined()
			expect(await properties.findByText('На проверке')).toBeDefined()
		}
	})
	it('shows the board context, description and sidebar metadata and closes from the footer', async () => {
		current.status = 'BACKLOG'
		current.boardColumnId = 'backlog'
		details({ projectName: 'Проект', boardName: 'Основная доска' })
		await screen.findByText('Контекст')
		expect(screen.getByText('Проект / Основная доска')).toBeDefined()
		expect(
			within(screen.getByRole('region', { name: 'Описание' })).getByText('Контекст'),
		).toBeDefined()
		expect(screen.getByRole('combobox', { name: 'Тип задачи' }).textContent).toContain(
			'Баг',
		)
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Колонка' }).textContent).toContain(
				'Бэклог',
			),
		)
		expect(
			screen.getByRole('button', { name: 'Скопировать ID задачи' }).textContent,
		).toBe(current.id)
		fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
		expect(onClose).toHaveBeenCalledOnce()
	})
	it('updates status and priority inline and refreshes the displayed data', async () => {
		details()
		await screen.findByRole('heading', { name: 'Задача' })
		await select('Тип задачи', 'История')
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				'task-action',
				{ type: 'STORY' },
			),
		)
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Тип задачи' }).textContent).toContain(
				'История',
			),
		)
		await select('Приоритет', 'Низкий')
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenLastCalledWith(
				'team-1',
				'project-1',
				'task-action',
				{ priority: 'LOW' },
			),
		)
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Приоритет' }).textContent).toContain(
				'Низкий',
			),
		)
	})
	it('moves to a system column inline by ID and refreshes its displayed title', async () => {
		details()
		await select('Колонка', 'Готово')
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				current.id,
				{ boardColumnId: 'done' },
			),
		)
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Колонка' }).textContent).toContain(
				'Готово',
			),
		)
		expect(current.status).toBe('DONE')
		expect(current.type).toBe('BUG')
	})
	it('displays and selects custom columns independently of the task status', async () => {
		current.boardColumnId = 'custom'
		current.status = 'IN_REVIEW'
		current.type = 'TECH_DEBT'
		details()
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Колонка' }).textContent).toContain(
				'Ожидает релиза',
			),
		)
		const board = taskBoard()
		board.columns.push({
			...board.columns[0]!,
			id: 'new-column',
			key: 'new_column',
			title: 'Новая колонка',
			isSystem: false,
		})
		boardsServiceMock.getAll.mockResolvedValue([board])
		await act(async () => {
			await client.invalidateQueries({ queryKey: boardsKeys.list('team-1', 'project-1') })
		})
		await select('Колонка', 'Новая колонка')
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				current.id,
				{ boardColumnId: 'new-column' },
			),
		)
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Колонка' }).textContent).toContain(
				'Новая колонка',
			),
		)
		expect(current.status).toBe('IN_REVIEW')
		expect(current.type).toBe('TECH_DEBT')
	})
	it('retries loading the actual column without substituting the task status', async () => {
		current.boardColumnId = 'custom'
		boardsServiceMock.getAll.mockRejectedValueOnce({ statusCode: 500 })
		details()
		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Не удалось загрузить колонки доски.',
		)
		expect(screen.getByRole('combobox', { name: 'Колонка' })).toHaveProperty(
			'disabled',
			true,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Обновить колонки' }))
		await waitFor(() =>
			expect(screen.getByRole('combobox', { name: 'Колонка' }).textContent).toContain(
				'Ожидает релиза',
			),
		)
		expect(screen.getByRole('combobox', { name: 'Колонка' })).toHaveProperty(
			'disabled',
			false,
		)
	})
	it('prefills a custom column independently of the stored task status', async () => {
		current.boardColumnId = 'custom'
		current.status = 'IN_REVIEW'
		details()
		await openEdit()
		expect(
			await screen.findByRole('radio', { name: 'Ожидает релиза', checked: true }),
		).toBeDefined()
	})
	it('clears unsaved changes when returning to the original column', async () => {
		details()
		await openEdit()
		fireEvent.click(await screen.findByRole('radio', { name: 'Готово' }))
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
				'disabled',
				false,
			),
		)
		fireEvent.click(screen.getByRole('radio', { name: 'На проверке' }))
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
				'disabled',
				true,
			),
		)
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
	})
	it('edits the actual column and saves it with other fields in one PATCH', async () => {
		details()
		await openEdit()
		const columns = await screen.findByRole('radiogroup', { name: 'Колонка' })
		expect(
			await within(columns).findByRole('radio', { name: 'На проверке', checked: true }),
		).toBeDefined()
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Обновлённая задача' },
		})
		fireEvent.click(within(columns).getByRole('radio', { name: 'Ожидает релиза' }))
		await saveEdit()
		await screen.findByRole('heading', { name: 'Обновлённая задача' })
		expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			current.id,
			{ title: 'Обновлённая задача', boardColumnId: 'custom' },
		)
		expect(current.status).toBe('IN_REVIEW')
		expect(current.boardColumnId).toBe('custom')
	})
	it('adds newly loaded custom columns without resetting an edited draft', async () => {
		details()
		await openEdit()
		await screen.findByRole('radio', { name: 'На проверке', checked: true })
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Мой черновик' },
		})
		const board = taskBoard()
		board.columns.push({
			...board.columns[0]!,
			id: 'new-column',
			key: 'new_column',
			title: 'Новая колонка',
			isSystem: false,
		})
		boardsServiceMock.getAll.mockResolvedValue([board])
		await act(async () => {
			await client.invalidateQueries({ queryKey: boardsKeys.list('team-1', 'project-1') })
		})
		fireEvent.click(await screen.findByRole('radio', { name: 'Новая колонка' }))
		expect(screen.getByLabelText('Название')).toHaveProperty('value', 'Мой черновик')
		await saveEdit()
		await screen.findByRole('heading', { name: 'Мой черновик' })
		expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			current.id,
			{ title: 'Мой черновик', boardColumnId: 'new-column' },
		)
	})
	it('retries loading columns and keeps the draft while saving is unavailable', async () => {
		boardsServiceMock.getAll.mockRejectedValue({
			statusCode: 500,
			message: 'Unavailable',
		})
		details()
		await openEdit()
		const retry = await screen.findByRole('button', { name: 'Обновить колонки' })
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Сохранённый черновик' },
		})
		expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
			'disabled',
			true,
		)
		boardsServiceMock.getAll.mockResolvedValue([taskBoard()])
		fireEvent.click(retry)
		await screen.findByRole('radio', { name: 'На проверке', checked: true })
		expect(screen.getByLabelText('Название')).toHaveProperty(
			'value',
			'Сохранённый черновик',
		)
		await saveEdit()
		await screen.findByRole('heading', { name: 'Сохранённый черновик' })
		expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			current.id,
			{ title: 'Сохранённый черновик' },
		)
	})
	it('requires another destination if the chosen column disappears before saving', async () => {
		details()
		await openEdit()
		fireEvent.click(await screen.findByRole('radio', { name: 'Ожидает релиза' }))
		await act(async () => {
			client.setQueryData<BoardListItem[]>(
				boardsKeys.list('team-1', 'project-1'),
				(boards) =>
					boards?.map((board) => ({
						...board,
						columns: board.columns.filter((column) => column.id !== 'custom'),
					})),
			)
		})
		expect(screen.getByRole('alert').textContent).toContain(
			'Выбранная колонка недоступна',
		)
		expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('radio', { name: 'Готово' }))
		await saveEdit()
		await screen.findByRole('heading', { name: 'Задача' })
		expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			current.id,
			{ boardColumnId: 'done' },
		)
	})
	it('reloads columns after the server rejects a stale destination and preserves the draft', async () => {
		const board = taskBoard()
		boardsServiceMock.getAll
			.mockResolvedValueOnce([board])
			.mockResolvedValue([
				{ ...board, columns: board.columns.filter((column) => column.id !== 'custom') },
			])
		tasksServiceMock.update.mockRejectedValueOnce({
			statusCode: 404,
			message: 'Колонка не найдена в текущей доске',
		})
		details()
		await openEdit()
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Черновик после конфликта' },
		})
		fireEvent.click(await screen.findByRole('radio', { name: 'Ожидает релиза' }))
		await saveEdit()
		await screen.findByText('Выбранная колонка недоступна. Выберите другую колонку.')
		expect(screen.getByLabelText('Название')).toHaveProperty(
			'value',
			'Черновик после конфликта',
		)
		expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(tasksServiceMock.update).toHaveBeenCalledOnce()
		fireEvent.click(screen.getByRole('radio', { name: 'Готово' }))
		await saveEdit()
		await screen.findByRole('heading', { name: 'Черновик после конфликта' })
		expect(tasksServiceMock.update).toHaveBeenCalledTimes(2)
	})
	it('prefills the shared form and preserves date time and untouched fields', async () => {
		details()
		await openEdit()
		expect(screen.getByLabelText('Описание')).toHaveProperty('value', 'Контекст')
		expect(screen.getByLabelText('Срок')).toHaveProperty('value', '15.11.2026')
		expect(
			screen.getByRole('radio', { name: 'Исполнитель', checked: true }),
		).toBeDefined()
		expect(screen.getByRole('radio', { name: 'Баг', checked: true })).toBeDefined()
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: '  Новое название  ' },
		})
		act(() => {
			width = 768
			listeners.forEach((fn) => fn())
		})
		expect(screen.getByLabelText('Название')).toHaveProperty('value', 'Новое название')
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-action',
				{ title: 'Новое название' },
			),
		)
		await screen.findByRole('heading', { name: 'Новое название' })
		expect(current.dueDate).toBe('2026-11-15T18:30:00.000Z')
		expect(
			client.getQueryData<Task>(tasksKeys.detail('team-1', 'project-1', 'task-action'))
				?.title,
		).toBe('Новое название')
		expect(screen.getAllByRole('dialog')).toHaveLength(1)
	})
	it('sends explicit null for clearing the assignee and date', async () => {
		details()
		await openEdit()
		fireEvent.click(
			within(screen.getByRole('radiogroup', { name: 'Исполнитель' })).getByRole('radio', {
				name: 'Без исполнителя',
			}),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Очистить дату' }))
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-action',
				{ assigneeId: null, dueDate: null },
			),
		)
		await screen.findByRole('heading', { name: 'Задача' })
		expect(current.assigneeId).toBeNull()
		expect(current.dueDate).toBeNull()
	})
	it('saves existing and new labels through the shared edit form', async () => {
		current.labels = ['refactor']
		tasksServiceMock.getLabels.mockResolvedValue(['refactor', 'Frontend'])
		details()
		await openEdit()
		expect(screen.getByRole('button', { name: 'Снять метку «refactor»' })).toBeDefined()
		const frontend = await screen.findByRole('button', {
			name: 'Добавить метку «Frontend»',
		})
		await act(async () => fireEvent.click(frontend))
		fireEvent.change(screen.getByLabelText('Метки'), { target: { value: ' urgent ' } })
		await act(async () =>
			fireEvent.keyDown(screen.getByLabelText('Метки'), { key: 'Enter' }),
		)
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
		await saveEdit()
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-action',
				{ labels: ['refactor', 'Frontend', 'urgent'] },
			),
		)
		await screen.findByRole('heading', { name: 'Задача' })
		expect(screen.getByText('urgent')).toBeDefined()
	})
	it('sends an empty array to clear every label', async () => {
		current.labels = ['refactor', 'Frontend']
		details()
		await openEdit()
		await act(async () =>
			fireEvent.click(screen.getByRole('button', { name: 'Снять метку «refactor»' })),
		)
		await act(async () =>
			fireEvent.click(screen.getByRole('button', { name: 'Снять метку «Frontend»' })),
		)
		await saveEdit()
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-action',
				{ labels: [] },
			),
		)
	})
	it('closes without PATCH when label order and letter case are the only changes', async () => {
		current.labels = ['Refactor', 'Frontend']
		details()
		await openEdit()
		for (const label of current.labels) {
			await act(async () =>
				fireEvent.click(screen.getByRole('button', { name: `Снять метку «${label}»` })),
			)
		}
		for (const value of ['frontend', 'refactor']) {
			fireEvent.change(screen.getByLabelText('Метки'), { target: { value } })
			await act(async () =>
				fireEvent.keyDown(screen.getByLabelText('Метки'), { key: 'Enter' }),
			)
		}
		await saveEdit()
		await screen.findByRole('heading', { name: 'Задача' })
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
	})
	it('keeps the edited draft after errors and blocks duplicate submissions until refetch completes', async () => {
		tasksServiceMock.update.mockRejectedValueOnce({
			statusCode: 403,
			message: 'Недостаточно прав',
		})
		details()
		await openEdit()
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Черновик' } })
		const form = screen.getByLabelText('Название').closest('form')!
		fireEvent.submit(form)
		fireEvent.submit(form)
		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Недостаточно прав',
		)
		expect(tasksServiceMock.update).toHaveBeenCalledTimes(1)
		expect(screen.getByLabelText('Название')).toHaveProperty('value', 'Черновик')
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }))
		await screen.findByRole('heading', { name: 'Черновик' })
		expect(tasksServiceMock.update).toHaveBeenCalledTimes(2)
	})
	it('cancels editing without updating the task', async () => {
		details()
		await openEdit()
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Не сохранять' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		await screen.findByRole('heading', { name: 'Задача' })
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
	})
	it('confirms deletion, preserves the confirmation on error and retries', async () => {
		tasksServiceMock.delete.mockRejectedValueOnce({
			statusCode: 500,
			message: 'Не удалось удалить',
		})
		details()
		await screen.findByRole('heading', { name: 'Задача' })
		fireEvent.click(await screen.findByRole('button', { name: 'Удалить задачу' }))
		expect(tasksServiceMock.delete).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Не удалось удалить',
		)
		expect(onClose).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
		expect(tasksServiceMock.delete).toHaveBeenLastCalledWith(
			'team-1',
			'project-1',
			'task-action',
		)
	})
	it('handles an unavailable direct task link with a retry and close', async () => {
		tasksServiceMock.getById.mockRejectedValueOnce({
			statusCode: 404,
			message: 'Missing',
		})
		details()
		expect(await screen.findByText('Задача не найдена.')).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		await screen.findByRole('heading', { name: 'Задача' })
		expect(screen.getByText('Контекст')).toBeDefined()
	})
	it('retains an assigned user absent from the current options unless explicitly changed', async () => {
		current.assigneeId = 'former-member'
		render(
			<TaskEditDialog
				teamId='team-1'
				projectId='project-1'
				task={current}
				onClose={onClose}
			/>,
			{ wrapper: Wrapper },
		)
		await screen.findByRole('radio', { name: 'На проверке', checked: true })
		expect(
			screen.getByRole('radio', { name: 'Назначенный участник', checked: true }),
		).toBeDefined()
		fireEvent.change(screen.getByLabelText('Описание'), {
			target: { value: 'Обновлённое описание' },
		})
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-action',
				{ description: 'Обновлённое описание' },
			),
		)
	})
})
