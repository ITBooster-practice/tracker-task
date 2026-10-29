import '@/test/mocks/api/boards-service.mock'
import '@/test/mocks/api/board-columns-service.mock'
import '@/test/mocks/api/tasks-service.mock'
import '@/test/mocks/api/projects-service.mock'
import '@/test/mocks/api/team-members-service.mock'

import {
	boardColumnsServiceMock,
	resetBoardColumnsServiceMock,
} from '@/test/mocks/api/board-columns-service.mock'
import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import {
	createBoardListItemFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import {
	projectsServiceMock,
	resetProjectsServiceMock,
} from '@/test/mocks/api/projects-service.mock'
import { createProjectFixture } from '@/test/mocks/api/projects.fixtures'
import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { teamMembersServiceMock } from '@/test/mocks/api/team-members-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem, BoardTask, BoardView } from '@repo/types'

import type { Board } from '@/views/boards/ui/board'
import type { BoardTaskDetailsDialog } from '@/views/boards/ui/board-task-details-dialog'
import type { BoardTaskFormDialog } from '@/views/boards/ui/board-task-form-dialog'
import { ProjectBoardPageView } from '@/views/boards/ui/project-board-page-view'
import { boardsKeys } from '@/shared/api/use-boards'
import { tasksKeys } from '@/shared/api/use-tasks'

const { boardState, formState, toastError, routerPush } = vi.hoisted(() => ({
	boardState: { current: null as ComponentProps<typeof Board> | null },
	formState: { current: null as ComponentProps<typeof BoardTaskFormDialog> | null },
	toastError: vi.fn(),
	routerPush: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@/views/boards/ui/create-board-dialog', () => ({
	CreateBoardDialog: ({ open }: { open: boolean }) =>
		open ? <section role='dialog' aria-label='Создание доски' /> : null,
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
		<a href={href}>{children}</a>
	),
}))
vi.mock('@repo/ui', () => ({
	toast: { error: toastError },
	cn: (...values: unknown[]) =>
		values.filter((value) => typeof value === 'string').join(' '),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Skeleton: () => <span />,
	Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
	Select: ({
		value,
		onValueChange,
		children,
	}: React.PropsWithChildren<{
		value: string
		onValueChange: (value: string) => void
	}>) => (
		<select
			aria-label='Доска проекта'
			value={value}
			onChange={(event) => onValueChange(event.target.value)}
		>
			{children}
		</select>
	),
	SelectTrigger: () => null,
	SelectValue: () => null,
	SelectContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
	SelectItem: ({ value, children }: React.PropsWithChildren<{ value: string }>) => (
		<option value={value}>{children}</option>
	),
	ConfirmDialog: ({
		open,
		title,
		onConfirm,
		onOpenChange,
		isPending,
		children,
	}: {
		open: boolean
		title: string
		onConfirm: () => void
		onOpenChange: (open: boolean) => void
		isPending: boolean
		children: React.ReactNode
	}) =>
		open ? (
			<section role='dialog' aria-label={title}>
				{children}
				<button disabled={isPending} onClick={onConfirm}>
					{isPending ? 'Удаляем…' : 'Удалить'}
				</button>
				<button disabled={isPending} onClick={() => onOpenChange(false)}>
					Отмена
				</button>
			</section>
		) : null,
	EmptyState: ({
		title,
		description,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
	}) => (
		<section>
			<h2>{title}</h2>
			<p>{description}</p>
			{action}
		</section>
	),
}))
vi.mock('@/views/boards/ui/board', () => ({
	Board: (props: ComponentProps<typeof Board>) => {
		boardState.current = props
		const { columns, onOpenTask, onMoveTask, disableInteraction } = props
		return (
			<section
				data-testid='board'
				data-movable={Boolean(onMoveTask)}
				data-disabled={Boolean(disableInteraction)}
			>
				{columns.map((column) => (
					<div key={column.id}>
						<h2>{column.title}</h2>
						{column.tasks.map((task) => (
							<button key={task.id} onClick={() => onOpenTask(task.id)}>
								{task.title}
							</button>
						))}
					</div>
				))}
			</section>
		)
	},
}))
vi.mock('@/views/boards/ui/board-task-details-dialog', () => ({
	BoardTaskDetailsDialog: ({
		task,
		readOnly,
		showActivity,
		onEditTask,
		onDeleteTask,
		onOpenChange,
	}: ComponentProps<typeof BoardTaskDetailsDialog>) =>
		task ? (
			<div
				role='dialog'
				data-readonly={Boolean(readOnly)}
				data-activity={Boolean(showActivity)}
			>
				<p>{task.description}</p>
				<span>{task.version}</span>
				<button onClick={() => onEditTask?.(task)}>Редактировать</button>
				<button onClick={() => onDeleteTask?.(task)}>Удалить задачу</button>
				<button onClick={() => onOpenChange(false)}>Закрыть</button>
			</div>
		) : null,
}))

vi.mock('@/views/boards/ui/board-task-form-dialog', () => ({
	BoardTaskFormDialog: (props: ComponentProps<typeof BoardTaskFormDialog>) => {
		formState.current = props
		return props.open ? (
			<section
				role='dialog'
				aria-label={props.mode === 'create' ? 'Создать задачу' : 'Редактировать задачу'}
			>
				{props.error && <p role='alert'>{props.error}</p>}
				<button disabled={props.isPending} onClick={() => props.onOpenChange(false)}>
					Отмена
				</button>
			</section>
		) : null
	},
}))

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((callback, rejectPromise) => {
		resolve = callback
		reject = rejectPromise
	})
	return { promise, resolve, reject }
}

const liveView = (projectId = 'project-1') => {
	const view = createBoardViewFixture('board-1', projectId)
	view.board.isDefault = true
	view.columns[0]!.isSystem = true
	view.board.name = 'Реальная доска'
	view.columns[0]!.title = 'Работа из API'
	view.columns[0]!.tasks[0]!.title = 'Задача из API'
	view.columns[0]!.tasks[0]!.description = 'Описание из API'
	view.columns[0]!.tasks[0]!.version = 7
	return view
}

const movableView = () => {
	const view = liveView()
	view.columns.push({
		...view.columns[0]!,
		id: 'target',
		key: 'DONE',
		title: 'Готово',
		isSystem: true,
		position: 1,
		tasks: [],
	})
	return view
}

describe('ProjectBoardPageView', () => {
	let client: QueryClient
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	beforeEach(() => {
		resetBoardColumnsServiceMock()
		toastError.mockReset()
		routerPush.mockReset()
		boardState.current = null
		formState.current = null
		teamMembersServiceMock.getMembers.mockReset()
		teamMembersServiceMock.getMembers.mockResolvedValue({
			data: [],
			meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
		})
		boardsServiceMock.getAll.mockReset()
		resetTasksServiceMock()
		resetProjectsServiceMock()
		projectsServiceMock.getById.mockImplementation(async (teamId, projectId) =>
			createProjectFixture({ teamId, id: projectId, name: 'Тестовый проект' }),
		)
		client = new QueryClient({
			defaultOptions: { queries: { retry: false, staleTime: Infinity } },
		})
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ isDefault: true }),
		])
		tasksServiceMock.getBoard.mockResolvedValue(liveView())
	})
	afterEach(() => {
		cleanup()
		client.clear()
	})

	it('создаёт колонку с техническим ключом и блокирует повторные изменения до обновления доски', async () => {
		const before = movableView()
		const after = structuredClone(before)
		const added = {
			...createBoardListItemFixture().columns[0]!,
			id: 'created-column',
			key: 'column_random',
			title: 'Проверка',
			position: 2,
		}
		after.columns.push({ ...added, tasks: [] })
		const request = deferred<typeof added>()
		const refetch = deferred<BoardView>()
		tasksServiceMock.getBoard
			.mockResolvedValueOnce(before)
			.mockReturnValueOnce(refetch.promise)
		boardColumnsServiceMock.create.mockReturnValue(request.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		let result!: Promise<void>
		act(() => {
			result = boardState.current!.onCreateColumn!('Проверка')
		})
		await waitFor(() => expect(boardColumnsServiceMock.create).toHaveBeenCalledTimes(1))
		expect(boardColumnsServiceMock.create).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'board-1',
			{ title: 'Проверка', key: expect.stringMatching(/^column_[0-9a-f-]{36}$/) },
		)
		await act(async () => {
			await expect(boardState.current!.onCreateColumn!('Дубль')).rejects.toThrow()
		})
		act(() =>
			boardState.current!.onMoveTask!({
				taskId: before.columns[0]!.tasks[0]!.id,
				toColumnId: 'target',
				toIndex: 0,
			}),
		)
		expect(tasksServiceMock.move).not.toHaveBeenCalled()
		await act(async () => {
			request.resolve(added)
		})
		await waitFor(() => expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(2))
		expect(boardState.current!.columnActionsDisabled).toBe(true)
		await act(async () => {
			refetch.resolve(after)
			await result
		})
		await screen.findByRole('heading', { name: 'Проверка' })
		await waitFor(() => expect(boardState.current!.columnActionsDisabled).toBe(false))
	})

	it('переименовывает системную колонку без изменения её ключа и статусов задач', async () => {
		const before = liveView()
		const after = structuredClone(before)
		after.columns[0]!.title = 'Новый этап'
		boardColumnsServiceMock.update.mockResolvedValue({
			...createBoardListItemFixture().columns[0]!,
			title: 'Новый этап',
		})
		tasksServiceMock.getBoard.mockResolvedValueOnce(before).mockResolvedValue(after)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		await act(async () => {
			await boardState.current!.onRenameColumn!(before.columns[0]!.id, 'Новый этап')
		})
		expect(boardColumnsServiceMock.update).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			'board-1',
			before.columns[0]!.id,
			{ title: 'Новый этап' },
		)
		await screen.findByRole('heading', { name: 'Новый этап' })
		const saved = client.getQueryData<BoardView>(
			tasksKeys.board('team-1', 'project-1', 'board-1'),
		)!
		expect(saved.columns[0]!.key).toBe(before.columns[0]!.key)
		expect(saved.columns[0]!.tasks).toEqual(before.columns[0]!.tasks)
	})

	it('завершение создания после смены проекта не меняет новую доску', async () => {
		const request =
			deferred<ReturnType<typeof createBoardListItemFixture>['columns'][number]>()
		boardColumnsServiceMock.create.mockReturnValue(request.promise)
		const { rerender } = render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' />,
			{ wrapper: Wrapper },
		)
		await screen.findByText('Задача из API')
		let result!: Promise<void>
		act(() => {
			result = boardState.current!.onCreateColumn!('Старый проект')
		})
		await waitFor(() => expect(boardColumnsServiceMock.create).toHaveBeenCalledTimes(1))
		const other = liveView('project-2')
		other.columns[0]!.title = 'Этап другого проекта'
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ projectId: 'project-2', isDefault: true }),
		])
		tasksServiceMock.getBoard.mockResolvedValue(other)
		rerender(<ProjectBoardPageView teamId='team-1' projectId='project-2' />)
		await screen.findByRole('heading', { name: 'Этап другого проекта' })
		const calls = tasksServiceMock.getBoard.mock.calls.length
		await act(async () => {
			request.resolve(createBoardListItemFixture().columns[0]!)
			await result
		})
		expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(calls)
		expect(screen.getByRole('heading', { name: 'Этап другого проекта' })).toBeDefined()
		expect(screen.queryByText('Старый проект')).toBeNull()
	})

	it('загружает основную доску в два этапа и показывает реальные карточки и детали', async () => {
		const list = deferred<BoardListItem[]>()
		const board = deferred<BoardView>()
		boardsServiceMock.getAll.mockReturnValueOnce(list.promise)
		tasksServiceMock.getBoard.mockReturnValueOnce(board.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		expect(screen.getByRole('status', { name: 'Загрузка доски' })).toBeDefined()
		expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
		await act(async () => {
			list.resolve([
				createBoardListItemFixture({ id: 'other', isDefault: false }),
				createBoardListItemFixture({ isDefault: true }),
			])
		})
		await waitFor(() =>
			expect(tasksServiceMock.getBoard).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				'board-1',
				expect.any(AbortSignal),
			),
		)
		expect(screen.getByRole('status', { name: 'Загрузка доски' })).toBeDefined()
		await act(async () => {
			board.resolve(liveView())
		})
		await screen.findByText('Задача из API')
		expect(boardsServiceMock.getAll).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			expect.any(AbortSignal),
		)
		expect(screen.getByRole('heading', { name: 'Реальная доска' })).toBeDefined()
		expect(screen.getByRole('heading', { name: 'Работа из API' })).toBeDefined()
		expect(
			screen.getByRole('link', { name: 'Тестовый проект' }).getAttribute('href'),
		).toBe('/teams/team-1/projects/project-1')
		expect(screen.getByTestId('board').getAttribute('data-movable')).toBe('true')
		fireEvent.click(screen.getByText('Задача из API'))
		expect(screen.getByRole('dialog').getAttribute('data-readonly')).toBe('false')
		expect(screen.getByRole('dialog').getAttribute('data-activity')).toBe('false')
		expect(screen.getByText('Описание из API')).toBeDefined()
		expect(screen.getByText('7')).toBeDefined()
		fireEvent.click(screen.getByText('Закрыть'))
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('открывает доску из URL и переключает её с сохранением контекста проекта', async () => {
		const other = createBoardViewFixture('other', 'project-1')
		other.board.name = 'Другая доска'
		other.columns[0]!.tasks[0]!.title = 'Карточка другой доски'
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ isDefault: true }),
			createBoardListItemFixture({ id: 'other', name: 'Другая доска' }),
		])
		tasksServiceMock.getBoard.mockImplementation(async (_team, _project, id) =>
			id === 'other' ? other : liveView(),
		)
		const { rerender } = render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='other' />,
			{ wrapper: Wrapper },
		)
		fireEvent.click(await screen.findByText('Карточка другой доски'))
		expect(screen.getByRole('dialog')).toBeDefined()
		expect(tasksServiceMock.getBoard).toHaveBeenCalledExactlyOnceWith(
			'team-1',
			'project-1',
			'other',
			expect.any(AbortSignal),
		)
		fireEvent.change(screen.getByRole('combobox', { name: 'Доска проекта' }), {
			target: { value: 'board-1' },
		})
		expect(routerPush).toHaveBeenCalledWith(
			'/teams/team-1/projects/project-1/board?boardId=board-1',
		)
		rerender(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='board-1' />,
		)
		await screen.findByText('Задача из API')
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('не подменяет отсутствующую доску из URL основной доской', async () => {
		render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='missing' />,
			{ wrapper: Wrapper },
		)
		await screen.findByText('Доска недоступна')
		expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
		expect(
			screen.getByRole('link', { name: 'К списку досок' }).getAttribute('href'),
		).toBe('/teams/team-1/projects/project-1')
	})

	it('позволяет открыть создание доски из пустого состояния', async () => {
		boardsServiceMock.getAll.mockResolvedValue([])
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('В проекте пока нет досок')
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		expect(screen.getByRole('dialog', { name: 'Создание доски' })).toBeDefined()
		expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
	})

	it('создаёт карточку через API и ждёт обновления доски без повторного POST', async () => {
		const before = liveView()
		before.columns[0]!.tasks = []
		const after = structuredClone(before)
		after.columns[0]!.tasks = [
			{ ...liveView().columns[0]!.tasks[0]!, id: 'created', title: 'Новая карточка' },
		]
		const post = deferred<ReturnType<typeof createTaskFixture>>()
		const refresh = deferred<BoardView>()
		tasksServiceMock.getBoard
			.mockResolvedValueOnce(before)
			.mockReturnValueOnce(refresh.promise)
		tasksServiceMock.create.mockReturnValueOnce(post.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('На доске пока нет задач')
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		const values = {
			title: 'Новая карточка',
			description: 'Контекст',
			type: 'BUG' as const,
			priority: 'HIGH' as const,
			boardColumnId: 'board-1-column',
			assigneeId: 'real-user',
			dueDate: '2026-11-15',
			tags: [],
		}
		act(() => {
			formState.current!.onSubmit(values)
			formState.current!.onSubmit(values)
		})
		await waitFor(() =>
			expect(tasksServiceMock.create).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				{
					title: 'Новая карточка',
					description: 'Контекст',
					type: 'BUG',
					priority: 'HIGH',
					status: 'TODO',
					assigneeId: 'real-user',
					dueDate: '2026-11-15T00:00:00.000Z',
				},
			),
		)
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('true')
		await act(async () => post.resolve(createTaskFixture({ id: 'created' })))
		await waitFor(() => expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(2))
		expect(formState.current!.open).toBe(true)
		expect(formState.current!.isPending).toBe(true)
		await act(async () => refresh.resolve(after))
		await screen.findByText('Новая карточка')
		await waitFor(() => expect(formState.current!.open).toBe(false))
	})

	it('редактирует задачу в произвольной колонке и очищает исполнителя и дедлайн без смены статуса', async () => {
		const before = liveView()
		before.columns[0]!.isSystem = false
		before.columns[0]!.key = 'CUSTOM'
		const task = before.columns[0]!.tasks[0]!
		task.assigneeId = 'user-2'
		task.dueDate = '2026-11-15T18:30:00.000Z'
		const after = structuredClone(before)
		Object.assign(after.columns[0]!.tasks[0]!, {
			title: 'Изменённая карточка',
			assigneeId: null,
			dueDate: null,
			version: 8,
		})
		tasksServiceMock.getBoard.mockResolvedValueOnce(before).mockResolvedValueOnce(after)
		tasksServiceMock.update.mockResolvedValue(
			createTaskFixture({ title: 'Изменённая карточка', version: 8 }),
		)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		fireEvent.click(await screen.findByText('Задача из API'))
		fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))
		expect(formState.current!.allowColumnChange).toBe(false)
		expect(formState.current!.showTags).toBe(false)
		act(() =>
			formState.current!.onSubmit({
				title: 'Изменённая карточка',
				description: '',
				type: 'STORY',
				priority: 'LOW',
				boardColumnId: task.boardColumnId,
				assigneeId: '',
				dueDate: '',
				tags: [],
			}),
		)
		await waitFor(() =>
			expect(tasksServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				task.id,
				{
					title: 'Изменённая карточка',
					description: '',
					type: 'STORY',
					priority: 'LOW',
					assigneeId: null,
					dueDate: null,
				},
			),
		)
		await waitFor(() => expect(formState.current!.open).toBe(false))
		expect(screen.getByText('Изменённая карточка')).toBeDefined()
		expect(tasksServiceMock.move).not.toHaveBeenCalled()
	})

	it('оставляет форму при ошибке и сохраняет исходное время дедлайна после повтора', async () => {
		const view = liveView()
		view.columns[0]!.tasks[0]!.dueDate = '2026-11-15T18:30:00.000Z'
		tasksServiceMock.getBoard.mockResolvedValue(view)
		tasksServiceMock.update
			.mockRejectedValueOnce({ statusCode: 403, message: 'Forbidden' })
			.mockResolvedValueOnce(createTaskFixture())
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		fireEvent.click(await screen.findByText('Задача из API'))
		fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))
		const values = {
			title: 'Обновление',
			description: '',
			priority: 'MEDIUM' as const,
			boardColumnId: 'board-1-column',
			assigneeId: '',
			dueDate: '2026-11-15',
			tags: [],
		}
		act(() => formState.current!.onSubmit(values))
		await screen.findByRole('alert')
		expect(formState.current!.open).toBe(true)
		expect(formState.current!.isPending).toBe(false)
		act(() => formState.current!.onSubmit(values))
		await waitFor(() => expect(formState.current!.open).toBe(false))
		expect(tasksServiceMock.update).toHaveBeenLastCalledWith(
			'team-1',
			'project-1',
			'task-1',
			expect.objectContaining({ dueDate: '2026-11-15T18:30:00.000Z' }),
		)
	})

	it('удаляет после подтверждения, показывает ошибку и обновляет доску после повтора', async () => {
		const view = liveView()
		const after = structuredClone(view)
		after.columns[0]!.tasks = []
		const remove = deferred<void>()
		tasksServiceMock.getBoard.mockResolvedValueOnce(view).mockResolvedValueOnce(after)
		tasksServiceMock.delete
			.mockRejectedValueOnce({ statusCode: 403, message: 'Forbidden' })
			.mockReturnValueOnce(remove.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		fireEvent.click(await screen.findByText('Задача из API'))
		fireEvent.click(screen.getByRole('button', { name: 'Удалить задачу' }))
		expect(tasksServiceMock.delete).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await screen.findByRole('alert')
		expect(screen.getByRole('dialog', { name: 'Удалить задачу?' })).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await waitFor(() => expect(tasksServiceMock.delete).toHaveBeenCalledTimes(2))
		expect(screen.getByRole('button', { name: 'Удаляем…' })).toHaveProperty(
			'disabled',
			true,
		)
		await act(async () => remove.resolve())
		await screen.findByText('На доске пока нет задач')
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(tasksServiceMock.delete).toHaveBeenLastCalledWith(
			'team-1',
			'project-1',
			'task-1',
		)
	})

	it('запоздавший ответ создания не закрывает форму другого проекта и не меняет его кэш', async () => {
		const post = deferred<ReturnType<typeof createTaskFixture>>()
		tasksServiceMock.create.mockReturnValueOnce(post.promise)
		const first = liveView()
		const second = liveView('project-2')
		second.board.name = 'Вторая доска'
		tasksServiceMock.getBoard.mockImplementation(async (_team, projectId) =>
			projectId === 'project-1' ? first : second,
		)
		boardsServiceMock.getAll.mockImplementation(async (_team, projectId) => [
			createBoardListItemFixture({ projectId, isDefault: true }),
		])
		const { rerender } = render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' />,
			{ wrapper: Wrapper },
		)
		fireEvent.click(await screen.findByRole('button', { name: 'Создать задачу' }))
		act(() =>
			formState.current!.onSubmit({
				title: 'Первая',
				description: '',
				priority: 'LOW',
				boardColumnId: 'board-1-column',
				assigneeId: '',
				dueDate: '',
				tags: [],
			}),
		)
		await waitFor(() => expect(tasksServiceMock.create).toHaveBeenCalledTimes(1))
		rerender(<ProjectBoardPageView teamId='team-1' projectId='project-2' />)
		await screen.findByRole('heading', { name: 'Вторая доска' })
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		await act(async () => post.resolve(createTaskFixture({ title: 'Первая' })))
		await waitFor(() =>
			expect(
				client.getQueryState(tasksKeys.board('team-1', 'project-1', 'board-1'))
					?.isInvalidated,
			).toBe(true),
		)
		expect(formState.current!.open).toBe(true)
		expect(formState.current!.isPending).toBe(false)
		expect(
			client.getQueryData(tasksKeys.board('team-1', 'project-2', 'board-1')),
		).toEqual(second)
	})

	it('сохраняет перенос с исходной версией, блокируя повтор до обновления доски', async () => {
		const before = movableView()
		const after = structuredClone(before)
		const moved = {
			...after.columns[0]!.tasks[0]!,
			boardColumnId: 'target',
			status: 'DONE' as const,
			position: 0,
			version: 8,
		}
		after.columns[0]!.tasks = []
		after.columns[1]!.tasks = [moved]
		const patch = deferred<BoardTask>()
		const refresh = deferred<BoardView>()
		tasksServiceMock.getBoard
			.mockResolvedValueOnce(before)
			.mockReturnValueOnce(refresh.promise)
		tasksServiceMock.move.mockReturnValueOnce(patch.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		const input = { taskId: 'task-1', toColumnId: 'target', toIndex: 0 }
		act(() => {
			boardState.current!.onMoveTask!(input)
			boardState.current!.onMoveTask!(input)
		})
		await waitFor(() =>
			expect(tasksServiceMock.move).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-1',
				{
					fromColumnId: 'board-1-column',
					toColumnId: 'target',
					position: 0,
					expectedVersion: 7,
				},
			),
		)
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('true')
		expect(
			client.getQueryData<BoardView>(tasksKeys.board('team-1', 'project-1', 'board-1'))!
				.columns[1]!.tasks[0]!.id,
		).toBe('task-1')
		await act(async () => patch.resolve(moved))
		await waitFor(() => expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(2))
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('true')
		act(() => boardState.current!.onMoveTask!(input))
		expect(tasksServiceMock.move).toHaveBeenCalledTimes(1)
		await act(async () => refresh.resolve(after))
		await waitFor(() =>
			expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('false'),
		)
		const back = structuredClone(before)
		back.columns[0]!.tasks[0]!.version = 9
		tasksServiceMock.getBoard.mockResolvedValueOnce(back)
		tasksServiceMock.move.mockResolvedValueOnce(back.columns[0]!.tasks[0]!)
		act(() =>
			boardState.current!.onMoveTask!({
				taskId: 'task-1',
				toColumnId: 'board-1-column',
				toIndex: 0,
			}),
		)
		await waitFor(() =>
			expect(tasksServiceMock.move).toHaveBeenLastCalledWith(
				'team-1',
				'project-1',
				'task-1',
				{
					fromColumnId: 'target',
					toColumnId: 'board-1-column',
					position: 0,
					expectedVersion: 8,
				},
			),
		)
		await waitFor(() =>
			expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('false'),
		)
	})

	it.each([409, 503])(
		'при ошибке %s откатывает перенос и показывает toast даже при ошибке refetch',
		async (statusCode) => {
			const before = movableView()
			const patch = deferred<BoardTask>()
			tasksServiceMock.getBoard
				.mockResolvedValueOnce(before)
				.mockRejectedValueOnce({ statusCode: 503, message: 'Refetch unavailable' })
			tasksServiceMock.move.mockReturnValueOnce(patch.promise)
			render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
				wrapper: Wrapper,
			})
			await screen.findByText('Задача из API')
			act(() =>
				boardState.current!.onMoveTask!({
					taskId: 'task-1',
					toColumnId: 'target',
					toIndex: 0,
				}),
			)
			await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
			await act(async () => patch.reject({ statusCode, message: 'Move failed' }))
			await waitFor(() =>
				expect(toastError).toHaveBeenCalledExactlyOnceWith(
					statusCode === 409
						? 'Доска изменилась. Попробуйте переместить задачу ещё раз.'
						: 'Не удалось переместить задачу. Попробуйте ещё раз.',
				),
			)
			await screen.findByText('Не удалось загрузить доску')
			expect(
				client.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
			).toEqual(before)
		},
	)

	it('не отправляет перенос без изменения позиции или в неизвестную колонку', async () => {
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		act(() => {
			boardState.current!.onMoveTask!({
				taskId: 'task-1',
				toColumnId: 'board-1-column',
				toIndex: 0,
			})
			boardState.current!.onMoveTask!({
				taskId: 'task-1',
				toColumnId: 'missing',
				toIndex: 0,
			})
		})
		expect(tasksServiceMock.move).not.toHaveBeenCalled()
	})

	it('запоздавшая ошибка переноса не меняет новую доску и не показывает чужой toast', async () => {
		const before = movableView()
		const other = liveView('project-2')
		other.columns[0]!.tasks[0]!.title = 'Задача другого проекта'
		const patch = deferred<BoardTask>()
		tasksServiceMock.getBoard.mockResolvedValueOnce(before).mockResolvedValueOnce(other)
		tasksServiceMock.move.mockReturnValueOnce(patch.promise)
		const { rerender } = render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' />,
			{ wrapper: Wrapper },
		)
		await screen.findByText('Задача из API')
		act(() =>
			boardState.current!.onMoveTask!({
				taskId: 'task-1',
				toColumnId: 'target',
				toIndex: 0,
			}),
		)
		await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
		rerender(<ProjectBoardPageView teamId='team-2' projectId='project-2' />)
		await screen.findByText('Задача другого проекта')
		await act(async () =>
			patch.reject({ statusCode: 409, message: 'Old request failed' }),
		)
		expect(toastError).not.toHaveBeenCalled()
		expect(screen.getByText('Задача другого проекта')).toBeDefined()
		expect(
			client.getQueryData(tasksKeys.board('team-2', 'project-2', 'board-1')),
		).toEqual(other)
	})

	it('показывает отсутствие досок без запроса с пустым boardId', async () => {
		boardsServiceMock.getAll.mockResolvedValue([])
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('В проекте пока нет досок')
		expect(screen.queryByRole('status')).toBeNull()
		expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
	})

	it.each(['columns', 'tasks'] as const)(
		'показывает пустое состояние без %s',
		async (empty) => {
			const view = liveView()
			if (empty === 'columns') view.columns = []
			else view.columns[0]!.tasks = []
			tasksServiceMock.getBoard.mockResolvedValue(view)
			render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
				wrapper: Wrapper,
			})
			await screen.findByText(
				empty === 'columns' ? 'На доске пока нет колонок' : 'На доске пока нет задач',
			)
			if (empty === 'tasks')
				expect(screen.getByRole('heading', { name: 'Работа из API' })).toBeDefined()
		},
	)

	it.each(['list', 'board'] as const)(
		'повторяет неудачный запрос %s после ошибки',
		async (failedQuery) => {
			const error = { statusCode: 503, message: 'Service unavailable' }
			if (failedQuery === 'list') boardsServiceMock.getAll.mockRejectedValueOnce(error)
			else tasksServiceMock.getBoard.mockRejectedValueOnce(error)
			render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
				wrapper: Wrapper,
			})
			await screen.findByText('Не удалось загрузить доску')
			fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
			await screen.findByText('Задача из API')
			expect(screen.queryByText('Не удалось загрузить доску')).toBeNull()
		},
	)

	it('использует первую доступную доску, когда основная отсутствует в ответе', async () => {
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ isDefault: false }),
		])
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		expect(tasksServiceMock.getBoard).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'board-1',
			expect.any(AbortSignal),
		)
	})

	it('разделяет кэш команд и проектов и закрывает прежнюю карточку при переходе', async () => {
		for (const [teamId, projectId, title] of [
			['team-1', 'project-1', 'Первая задача'],
			['team-2', 'project-2', 'Другая задача'],
		]) {
			const view = liveView(projectId)
			view.columns[0]!.tasks[0]!.title = title!
			client.setQueryData(boardsKeys.list(teamId!, projectId!), [
				createBoardListItemFixture({ isDefault: true, projectId }),
			])
			client.setQueryData(tasksKeys.board(teamId!, projectId!, 'board-1'), view)
		}
		const { rerender } = render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' />,
			{ wrapper: Wrapper },
		)
		fireEvent.click(screen.getByText('Первая задача'))
		expect(screen.getByRole('dialog')).toBeDefined()
		rerender(<ProjectBoardPageView teamId='team-2' projectId='project-2' />)
		expect(screen.getByText('Другая задача')).toBeDefined()
		expect(screen.queryByText('Первая задача')).toBeNull()
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(
			(await screen.findByRole('link', { name: 'Тестовый проект' })).getAttribute('href'),
		).toBe('/teams/team-2/projects/project-2')
		expect(boardsServiceMock.getAll).not.toHaveBeenCalled()
		expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
	})
})
