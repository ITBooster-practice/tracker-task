import '@/test/mocks/api/boards-service.mock'
import '@/test/mocks/api/tasks-service.mock'
import '@/test/mocks/api/projects-service.mock'
import '@/test/mocks/api/team-members-service.mock'

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
import {
	resetBoardHistoryMock,
	useBoardSearchParamsMock,
} from '@/test/mocks/views/boards/board-history.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem, BoardTask, BoardView } from '@repo/types'

import type { Board } from '@/views/boards/ui/board'
import { ProjectBoardPageView } from '@/views/boards/ui/project-board-page-view'
import type { TaskDetailsDialog } from '@/features/tasks'
import { useUserStore } from '@/entities/user'
import { boardsKeys } from '@/shared/api/use-boards'
import { tasksKeys } from '@/shared/api/use-tasks'
import { syncServerClock } from '@/shared/lib/server-clock'

const { boardState, detailsState, toastError, toastInfo, routerPush, routerReplace } =
	vi.hoisted(() => ({
		boardState: { current: null as ComponentProps<typeof Board> | null },
		detailsState: { current: null as ComponentProps<typeof TaskDetailsDialog> | null },
		toastError: vi.fn(),
		toastInfo: vi.fn(),
		routerPush: vi.fn(),
		routerReplace: vi.fn(),
	}))

vi.mock('@/features/tasks', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/features/tasks')>()),
	TaskDetailsDialog: (props: ComponentProps<typeof TaskDetailsDialog>) => {
		detailsState.current = props
		return (
			<section role='dialog' aria-label='Shared task details'>
				<button onClick={props.onClose}>Close details</button>
			</section>
		)
	},
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: routerPush, replace: routerReplace }),
	useSearchParams: () => useBoardSearchParamsMock(),
}))
vi.mock('@/views/boards/ui/create-board-dialog', () => ({
	CreateBoardDialog: ({ open }: { open: boolean }) =>
		open ? <section role='dialog' aria-label='Создание доски' /> : null,
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
		<a href={href}>{children}</a>
	),
}))
vi.mock('@repo/ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@repo/ui')>()),
	toast: { error: toastError, info: toastInfo, success: vi.fn() },
	cn: (...values: unknown[]) =>
		values.filter((value) => typeof value === 'string').join(' '),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Skeleton: () => <span />,
	Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
	Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
	Select: ({
		value,
		onValueChange,
		children,
		name,
	}: React.PropsWithChildren<{
		value: string
		name?: string
		onValueChange: (value: string) => void
	}>) => (
		<select
			aria-label={name ?? 'Доска проекта'}
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
				{props.emptyState}
			</section>
		)
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
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn()
				unobserve = vi.fn()
				disconnect = vi.fn()
			},
		)
		vi.stubGlobal('matchMedia', () => ({
			matches: true,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
		}))
		useUserStore.setState({
			user: { id: 'owner', name: 'Owner', email: 'owner@example.com' },
		})
		resetBoardHistoryMock()
		toastError.mockReset()
		toastInfo.mockReset()
		routerPush.mockReset()
		routerReplace.mockReset()
		boardsServiceMock.archive.mockReset().mockResolvedValue(undefined)
		boardState.current = null
		detailsState.current = null
		teamMembersServiceMock.getMembers.mockReset()
		teamMembersServiceMock.getMembers.mockResolvedValue({
			data: [
				{
					id: 'member-owner',
					userId: 'owner',
					name: 'Owner',
					email: 'owner@example.com',
					role: 'OWNER',
					joinedAt: '2026-01-01T00:00:00.000Z',
				},
			],
			meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
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
		vi.unstubAllGlobals()
		cleanup()
		client.clear()
		vi.useRealTimers()
	})

	it('returns to the active board route after archiving the selected board', async () => {
		resetBoardHistoryMock('/teams/team-1/projects/project-1/board?boardId=board-1')
		render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='board-1' />,
			{ wrapper: Wrapper },
		)
		await screen.findByText('Задача из API')
		fireEvent.click(await screen.findByRole('button', { name: 'Настроить доску' }))
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		boardsServiceMock.getAll.mockResolvedValue([])
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		await waitFor(() =>
			expect(routerReplace).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/board',
			),
		)
		expect(boardsServiceMock.archive).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'board-1',
			{ expectedUpdatedAt: liveView().board.updatedAt },
		)
	})

	it('обновляет фильтр просроченных по серверному времени без нового запроса', async () => {
		vi.useFakeTimers({
			toFake: [
				'Date',
				'performance',
				'setTimeout',
				'clearTimeout',
				'setInterval',
				'clearInterval',
			],
		})
		vi.setSystemTime(new Date('2099-01-01T00:00:00Z'))
		syncServerClock('Mon, 02 Nov 2026 12:00:00 GMT')
		const view = liveView()
		view.columns[0]!.tasks[0]!.dueDate = '2026-11-02T12:00:01Z'
		view.columns[0]!.tasks[0]!.status = 'TODO'
		tasksServiceMock.getBoard.mockResolvedValue(view)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await act(async () => {
			await vi.advanceTimersByTimeAsync(100)
		})
		fireEvent.click(screen.getByRole('button', { name: 'Просроченные' }))
		expect(boardState.current!.columns[0]!.tasks).toHaveLength(0)
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000)
		})
		expect(boardState.current!.columns[0]!.tasks.map((task) => task.id)).toEqual([
			view.columns[0]!.tasks[0]!.id,
		])
		expect(tasksServiceMock.getBoard).toHaveBeenCalledOnce()
	})

	it('показывает в фильтре задачу со сроком 26 октября из колонки Готово', async () => {
		resetBoardHistoryMock('/teams/team-1/projects/project-1/board?overdue=true')
		syncServerClock('Mon, 02 Nov 2026 12:00:00 GMT')
		const view = movableView()
		view.columns[0]!.tasks[0]!.dueDate = '2099-01-01T00:00:00Z'
		view.columns[1]!.tasks = [
			{
				...view.columns[0]!.tasks[0]!,
				id: 'expired-in-done',
				title: 'Показать предупреждение о несохранённом описании',
				status: 'DONE',
				boardColumnId: view.columns[1]!.id,
				dueDate: '2026-10-26T00:00:00Z',
			},
		]
		tasksServiceMock.getBoard.mockResolvedValue(view)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByRole('button', {
			name: 'Показать предупреждение о несохранённом описании',
		})
		expect(boardState.current!.columns[0]!.tasks).toHaveLength(0)
		expect(boardState.current!.columns[1]!.tasks.map((task) => task.id)).toEqual([
			'expired-in-done',
		])
		expect(
			screen.getByRole('button', { name: 'Просроченные' }).getAttribute('aria-pressed'),
		).toBe('true')
	})

	it('меняет группировку без записи задач и сохраняет фильтры в URL', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?priority=HIGH&extra=keep',
		)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		fireEvent.click(await screen.findByRole('radio', { name: 'По приоритету' }))
		await waitFor(() => expect(boardState.current).not.toBeNull())
		expect(boardState.current!.grouping).toBe('priority')
		expect(boardState.current!.lanes!.map((lane) => lane.priority)).toEqual([
			'CRITICAL',
			'HIGH',
			'MEDIUM',
			'LOW',
		])
		fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }))
		expect(window.location.search).toBe('?extra=keep&groupBy=priority')
		expect(tasksServiceMock.move).not.toHaveBeenCalled()
		expect(tasksServiceMock.update).not.toHaveBeenCalled()
		expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(1)
	})

	it('передаёт приоритет и полный индекс группы одним запросом переноса', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?groupBy=priority&type=BUG',
		)
		const view = movableView()
		const task = view.columns[0]!.tasks[0]!
		task.priority = 'HIGH'
		task.type = 'BUG'
		view.columns[1]!.tasks = ['hidden', 'anchor', 'tail'].map((id, index) => ({
			...task,
			id,
			title: id,
			boardColumnId: 'target',
			position: index,
			priority: id === 'anchor' ? 'LOW' : 'MEDIUM',
			type: id === 'anchor' ? 'BUG' : 'TASK',
		}))
		tasksServiceMock.getBoard.mockResolvedValue(view)
		tasksServiceMock.move.mockResolvedValue({
			...task,
			boardColumnId: 'target',
			priority: 'LOW',
			position: 1,
			version: 8,
		})
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		act(
			() =>
				void boardState.current!.onMoveTask!({
					taskId: task.id,
					toColumnId: 'target',
					toIndex: 0,
					priority: 'LOW',
				}),
		)
		await waitFor(() =>
			expect(tasksServiceMock.move).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				task.id,
				{
					fromColumnId: view.columns[0]!.id,
					toColumnId: 'target',
					position: 1,
					expectedVersion: 7,
					priority: 'LOW',
				},
			),
		)
	})

	it('сохраняет снятие исполнителя при неизменных колонке и позиции', async () => {
		resetBoardHistoryMock('/teams/team-1/projects/project-1/board?groupBy=assignee')
		const view = liveView(),
			task = view.columns[0]!.tasks[0]!
		task.assigneeId = 'anna'
		tasksServiceMock.getBoard.mockResolvedValue(view)
		tasksServiceMock.move.mockResolvedValue({ ...task, assigneeId: null, version: 8 })
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		act(
			() =>
				void boardState.current!.onMoveTask!({
					taskId: task.id,
					toColumnId: view.columns[0]!.id,
					toIndex: 0,
					assigneeId: null,
				}),
		)
		await waitFor(() =>
			expect(tasksServiceMock.move).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				task.id,
				{
					fromColumnId: view.columns[0]!.id,
					toColumnId: view.columns[0]!.id,
					position: 0,
					expectedVersion: 7,
					assigneeId: null,
				},
			),
		)
	})

	it.each([403, 409])(
		'при ошибке группы %s откатывает метаданные и порядок',
		async (statusCode) => {
			const view = movableView()
			view.columns[0]!.tasks[0]!.priority = 'HIGH'
			const request = deferred<BoardTask>()
			tasksServiceMock.move.mockReturnValue(request.promise)
			tasksServiceMock.getBoard.mockResolvedValue(view)
			render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
				wrapper: Wrapper,
			})
			await screen.findByText('Задача из API')
			const key = tasksKeys.board('team-1', 'project-1', 'board-1')
			act(
				() =>
					void boardState.current!.onMoveTask!({
						taskId: view.columns[0]!.tasks[0]!.id,
						toColumnId: 'target',
						toIndex: 0,
						priority: 'LOW',
					}),
			)
			await waitFor(() =>
				expect(client.getQueryData<BoardView>(key)!.columns[1]!.tasks[0]!.priority).toBe(
					'LOW',
				),
			)
			await act(async () => request.reject({ statusCode, message: 'Failed' }))
			await waitFor(() => expect(client.getQueryData(key)).toEqual(view))
			expect(toastError).toHaveBeenCalledWith(
				statusCode === 403
					? 'Недостаточно прав для изменения задачи.'
					: 'Доска изменилась. Попробуйте переместить задачу ещё раз.',
			)
		},
	)

	it('сообщает, когда перенос в другую группу скрывает карточку активным фильтром', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?groupBy=priority&priority=HIGH',
		)
		const before = liveView()
		before.columns[0]!.tasks[0]!.priority = 'HIGH'
		const after = structuredClone(before)
		after.columns[0]!.tasks[0]!.priority = 'LOW'
		after.columns[0]!.tasks[0]!.version = 8
		tasksServiceMock.getBoard.mockResolvedValueOnce(before).mockResolvedValue(after)
		tasksServiceMock.move.mockResolvedValue(after.columns[0]!.tasks[0]!)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		act(
			() =>
				void boardState.current!.onMoveTask!({
					taskId: before.columns[0]!.tasks[0]!.id,
					toColumnId: before.columns[0]!.id,
					toIndex: 0,
					priority: 'LOW',
				}),
		)
		await waitFor(() =>
			expect(toastInfo).toHaveBeenCalledWith(
				'Задача перемещена и скрыта текущими фильтрами.',
			),
		)
		expect(window.location.search).toContain('priority=HIGH')
	})

	it('совмещает URL-фильтры с поиском, сохраняет полный кеш и сбрасывает только параметры отбора', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?boardId=board-1&priority=HIGH&type=BUG&assignee=anna&q=REFACTOR&extra=keep',
		)
		const view = movableView()
		view.columns[0]!.tasks = [
			{
				...view.columns[0]!.tasks[0]!,
				id: 'match',
				title: 'Исправить поиск',
				labels: ['refactor'],
				type: 'BUG',
				priority: 'HIGH',
				assigneeId: 'anna',
			},
			{
				...view.columns[0]!.tasks[0]!,
				id: 'hidden',
				title: 'Другая задача',
				type: 'TASK',
				priority: 'LOW',
				assigneeId: null,
			},
		]
		tasksServiceMock.getBoard.mockResolvedValue(view)
		render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='board-1' />,
			{ wrapper: Wrapper },
		)
		await screen.findByText('Исправить поиск')
		expect(screen.getByPlaceholderText('Поиск по названию, коду или метке')).toBeDefined()
		expect(screen.queryByText('Другая задача')).toBeNull()
		expect(boardState.current!.columns).toHaveLength(2)
		expect(
			client.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
		).toEqual(view)
		fireEvent.change(screen.getByLabelText('Поиск задач'), {
			target: { value: 'ничего такого' },
		})
		await screen.findByRole('heading', { name: 'Ничего не найдено' })
		fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }))
		await screen.findByText('Исправить поиск')
		expect(window.location.search).toBe(
			'?boardId=board-1&priority=HIGH&type=BUG&assignee=anna&extra=keep',
		)
		fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }))
		await screen.findByText('Другая задача')
		expect(window.location.search).toBe('?boardId=board-1&extra=keep')
		expect(document.activeElement).toBe(screen.getByLabelText('Поиск задач'))
		expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(1)
	})

	it('объясняет нулевой результат фильтров и сбрасывает только условия отбора', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?boardId=board-1&type=BUG&priority=LOW&groupBy=assignee&extra=keep',
		)
		const view = movableView()
		tasksServiceMock.getBoard.mockResolvedValue(view)
		render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='board-1' />,
			{ wrapper: Wrapper },
		)
		await screen.findByRole('heading', { name: 'Нет задач с такими фильтрами' })
		expect(screen.getByText(/не соответствует условиям/).textContent).toContain(
			'«Баг» и «Низкий приоритет»',
		)
		expect(
			client.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
		).toEqual(view)
		fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
		await screen.findByText('Задача из API')
		expect(window.location.search).toBe('?boardId=board-1&groupBy=assignee&extra=keep')
		expect(document.activeElement).toBe(screen.getByLabelText('Поиск задач'))
		expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(1)
	})

	it('переносит видимую карточку по полному порядку, не подменяя индекс скрытых задач', async () => {
		resetBoardHistoryMock('/teams/team-1/projects/project-1/board?priority=HIGH')
		const view = movableView()
		view.columns[0]!.tasks[0]!.priority = 'HIGH'
		view.columns[1]!.tasks = ['hidden-before', 'visible', 'hidden-after'].map(
			(id, index) => ({
				...view.columns[0]!.tasks[0]!,
				id,
				title: id,
				boardColumnId: 'target',
				position: index,
				priority: id === 'visible' ? 'HIGH' : 'LOW',
			}),
		)
		tasksServiceMock.getBoard.mockResolvedValue(view)
		tasksServiceMock.move.mockResolvedValue({
			...view.columns[0]!.tasks[0]!,
			boardColumnId: 'target',
			position: 1,
			version: 8,
		})
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		expect(boardState.current!.columns[1]!.tasks.map((task) => task.id)).toEqual([
			'visible',
		])
		act(
			() =>
				void boardState.current!.onMoveTask!({
					taskId: view.columns[0]!.tasks[0]!.id,
					toColumnId: 'target',
					toIndex: 0,
				}),
		)
		await waitFor(() =>
			expect(tasksServiceMock.move).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				view.columns[0]!.tasks[0]!.id,
				{
					fromColumnId: view.columns[0]!.id,
					toColumnId: 'target',
					position: 1,
					expectedVersion: 7,
				},
			),
		)
	})

	it('при переключении доски сохраняет фильтры и посторонние query-параметры', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/board?priority=HIGH&q=test&extra=keep',
		)
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ isDefault: true }),
			createBoardListItemFixture({ id: 'other', name: 'Другая' }),
		])
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByRole('heading', { name: 'Ничего не найдено' })
		fireEvent.keyDown(screen.getByTitle('Переключить доску'), { key: 'Enter' })
		fireEvent.click(screen.getByRole('menuitem', { name: /^Другая/ }))
		expect(routerPush).toHaveBeenCalledWith(
			'/teams/team-1/projects/project-1/board?priority=HIGH&q=test&extra=keep&boardId=other',
		)
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
		expect(screen.getByRole('textbox', { name: 'Поиск задач' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Создать задачу' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(document.querySelectorAll('[data-slot=card-skeleton]')).toHaveLength(13)
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
		expect(document.querySelectorAll('[data-slot=card-skeleton]')).toHaveLength(3)
		expect(screen.getByRole('status', { name: 'Загрузка доски' }).textContent).toContain(
			'To do',
		)
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
		expect(detailsState.current).toMatchObject({
			teamId: 'team-1',
			projectId: 'project-1',
			taskId: liveView().columns[0]!.tasks[0]!.id,
		})
		expect(new URLSearchParams(window.location.search).get('taskId')).toBe(
			liveView().columns[0]!.tasks[0]!.id,
		)
		fireEvent.click(screen.getByText('Close details'))
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('shows server-hydrated custom column headings while task cards are still loading', () => {
		const board = createBoardListItemFixture({ id: 'custom', isDefault: false })
		board.columns[0]!.title = 'Ожидает релиза'
		board.columns[0]!.color = 'orange'
		client.setQueryData(boardsKeys.list('team-1', 'project-1'), [board])
		tasksServiceMock.getBoard.mockReturnValueOnce(deferred<BoardView>().promise)
		render(
			<ProjectBoardPageView teamId='team-1' projectId='project-1' boardId='custom' />,
			{ wrapper: Wrapper },
		)
		const heading = screen.getByRole('heading', { name: 'Ожидает релиза', level: 2 })
		expect(heading.closest('[aria-hidden=true]')).toBeNull()
		expect(heading.parentElement!.className).toContain('border-board-orange')
		expect(screen.getByRole('status', { name: 'Загрузка доски' })).toBeDefined()
		expect(document.querySelectorAll('[data-slot=card-skeleton]')).toHaveLength(3)
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
		fireEvent.keyDown(screen.getByTitle('Переключить доску'), { key: 'Enter' })
		fireEvent.click(screen.getByRole('menuitem', { name: /^Board/ }))
		expect(routerPush).toHaveBeenCalledWith(
			'/teams/team-1/projects/project-1/board?boardId=board-1',
		)
		resetBoardHistoryMock('/teams/team-1/projects/project-1/board?boardId=board-1')
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
		teamMembersServiceMock.getMembers.mockResolvedValue({
			data: [
				{
					id: 'member-1',
					userId: 'real-user',
					name: 'Участник',
					email: 'member@example.com',
					role: 'MEMBER',
					joinedAt: '2026-01-01T00:00:00.000Z',
				},
			],
			meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
		})
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
		await screen.findByRole('heading', { name: 'На доске пока нет задач' })
		fireEvent.click(screen.getByRole('button', { name: 'Создать первую задачу' }))
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Новая карточка' },
		})
		fireEvent.change(screen.getByLabelText('Описание'), { target: { value: 'Контекст' } })
		fireEvent.click(screen.getByRole('radio', { name: 'Баг' }))
		fireEvent.click(screen.getByRole('radio', { name: 'Высокий' }))
		fireEvent.click(await screen.findByRole('radio', { name: 'Участник' }))
		fireEvent.change(screen.getByLabelText('Срок'), { target: { value: '15.11.2026' } })
		const form = screen.getByLabelText('Название').closest('form')!
		fireEvent.submit(form)
		fireEvent.submit(form)
		await waitFor(() =>
			expect(tasksServiceMock.create).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				{
					title: 'Новая карточка',
					description: 'Контекст',
					labels: [],
					type: 'BUG',
					priority: 'HIGH',
					status: 'TODO',
					boardColumnId: before.columns[0]!.id,
					assigneeId: 'real-user',
					dueDate: '2026-11-15T00:00:00.000Z',
				},
			),
		)
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('true')
		await waitFor(() =>
			expect(boardState.current!.pendingTasks).toEqual([
				expect.objectContaining({
					title: 'Новая карточка',
					type: 'BUG',
					boardColumnId: before.columns[0]!.id,
				}),
			]),
		)
		expect(screen.getByText('Сохраняем новую задачу…')).toBeDefined()
		await act(async () => post.resolve(createTaskFixture({ id: 'created' })))
		await waitFor(() => expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(2))
		expect(screen.getByRole('dialog', { name: 'Создать задачу' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Создание…' })).toHaveProperty(
			'disabled',
			true,
		)
		await act(async () => refresh.resolve(after))
		await screen.findByText('Новая карточка')
		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Создать задачу' })).toBeNull(),
		)
		expect(boardState.current!.pendingTasks).toHaveLength(0)
	})

	it('оставляет карточки при обновлении и при ошибке повторного запроса', async () => {
		const refresh = deferred<BoardView>()
		tasksServiceMock.getBoard
			.mockResolvedValueOnce(liveView())
			.mockReturnValueOnce(refresh.promise)
		render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
			wrapper: Wrapper,
		})
		await screen.findByText('Задача из API')
		let refreshing: Promise<void>
		act(() => {
			refreshing = client.invalidateQueries({
				queryKey: tasksKeys.board('team-1', 'project-1', 'board-1'),
			})
		})
		await screen.findByText('Обновляем · пока показаны предыдущие данные')
		expect(screen.getByText('Задача из API')).toBeDefined()
		await act(async () => {
			refresh.reject({ statusCode: 500, message: 'Unavailable' })
			await refreshing!
		})
		expect(screen.getByText('Задача из API')).toBeDefined()
		expect((await screen.findByRole('alert')).textContent).toContain(
			'Не удалось обновить доску',
		)
		expect(screen.getByRole('button', { name: 'Повторить' })).toBeDefined()
	})

	it.each([403, 404])(
		'показывает ошибку доступа %s при повторном запросе',
		async (statusCode) => {
			tasksServiceMock.getBoard
				.mockResolvedValueOnce(liveView())
				.mockRejectedValueOnce({ statusCode, message: 'Unavailable' })
			render(<ProjectBoardPageView teamId='team-1' projectId='project-1' />, {
				wrapper: Wrapper,
			})
			await screen.findByText('Задача из API')
			await act(async () => {
				await client.invalidateQueries({
					queryKey: tasksKeys.board('team-1', 'project-1', 'board-1'),
				})
			})
			await screen.findByRole('heading', { name: 'Не удалось загрузить доску' })
			expect(screen.getByRole('button', { name: 'Повторить' })).toBeDefined()
			expect(screen.queryByTestId('board')).toBeNull()
		},
	)

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
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Создать задачу' })).toHaveProperty(
				'disabled',
				false,
			),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Первая' } })
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() => expect(tasksServiceMock.create).toHaveBeenCalledTimes(1))
		rerender(<ProjectBoardPageView teamId='team-1' projectId='project-2' />)
		await screen.findByRole('heading', { name: 'Вторая доска' })
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Создать задачу' })).toHaveProperty(
				'disabled',
				false,
			),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		await act(async () => post.resolve(createTaskFixture({ title: 'Первая' })))
		await waitFor(() =>
			expect(
				client.getQueryState(tasksKeys.board('team-1', 'project-1', 'board-1'))
					?.isInvalidated,
			).toBe(true),
		)
		expect(screen.getByRole('dialog', { name: 'Создать задачу' })).toBeDefined()
		expect(screen.getByLabelText('Название').closest('fieldset')).toHaveProperty(
			'disabled',
			false,
		)
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
		act(() => void boardState.current!.onMoveTask!(input))
		expect(tasksServiceMock.move).toHaveBeenCalledTimes(1)
		await act(async () => refresh.resolve(after))
		await waitFor(() =>
			expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('false'),
		)
		const back = structuredClone(before)
		back.columns[0]!.tasks[0]!.version = 9
		tasksServiceMock.getBoard.mockResolvedValueOnce(back)
		tasksServiceMock.move.mockResolvedValueOnce(back.columns[0]!.tasks[0]!)
		act(
			() =>
				void boardState.current!.onMoveTask!({
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
			act(
				() =>
					void boardState.current!.onMoveTask!({
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
			await screen.findByText('Не удалось обновить доску. Показаны предыдущие данные.')
			expect(screen.getByText('Задача из API')).toBeDefined()
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
		act(
			() =>
				void boardState.current!.onMoveTask!({
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

	it('creates tasks on a non-default board in its selected column', async () => {
		boardsServiceMock.getAll.mockResolvedValue([
			createBoardListItemFixture({ isDefault: false }),
		])
		const view = liveView()
		view.board.isDefault = false
		view.columns.forEach((column) => {
			column.isSystem = false
		})
		tasksServiceMock.getBoard.mockResolvedValue(view)
		tasksServiceMock.create.mockResolvedValue(createTaskFixture())
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
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'На новой доске' },
		})
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() =>
			expect(tasksServiceMock.create).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				expect.objectContaining({
					title: 'На новой доске',
					boardColumnId: view.columns[0]!.id,
				}),
			),
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
		resetBoardHistoryMock('/teams/team-2/projects/project-2/board')
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
