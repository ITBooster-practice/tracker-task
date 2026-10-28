import '@/test/mocks/api/boards-service.mock'
import '@/test/mocks/api/tasks-service.mock'
import '@/test/mocks/api/projects-service.mock'

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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem, BoardView } from '@repo/types'

import type { Board } from '@/views/boards/ui/board'
import type { BoardTaskDetailsDialog } from '@/views/boards/ui/board-task-details-dialog'
import { ProjectBoardPageView } from '@/views/boards/ui/project-board-page-view'
import { boardsKeys } from '@/shared/api/use-boards'
import { tasksKeys } from '@/shared/api/use-tasks'

vi.mock('next/link', () => ({
	default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
		<a href={href}>{children}</a>
	),
}))
vi.mock('@repo/ui', () => ({
	cn: (...values: unknown[]) =>
		values.filter((value) => typeof value === 'string').join(' '),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Skeleton: () => <span />,
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
	Board: ({ columns, onOpenTask, onMoveTask }: ComponentProps<typeof Board>) => (
		<section data-testid='board' data-movable={Boolean(onMoveTask)}>
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
	),
}))
vi.mock('@/views/boards/ui/board-task-details-dialog', () => ({
	BoardTaskDetailsDialog: ({
		task,
		readOnly,
		onOpenChange,
	}: ComponentProps<typeof BoardTaskDetailsDialog>) =>
		task ? (
			<div role='dialog' data-readonly={readOnly}>
				<p>{task.description}</p>
				<span>{task.version}</span>
				<button onClick={() => onOpenChange(false)}>Закрыть</button>
			</div>
		) : null,
}))

function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((callback) => {
		resolve = callback
	})
	return { promise, resolve }
}

const liveView = (projectId = 'project-1') => {
	const view = createBoardViewFixture('board-1', projectId)
	view.board.name = 'Реальная доска'
	view.columns[0]!.title = 'Работа из API'
	view.columns[0]!.tasks[0]!.title = 'Задача из API'
	view.columns[0]!.tasks[0]!.description = 'Описание из API'
	view.columns[0]!.tasks[0]!.version = 7
	return view
}

describe('ProjectBoardPageView', () => {
	let client: QueryClient
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	beforeEach(() => {
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
		expect(screen.getByTestId('board').getAttribute('data-movable')).toBe('false')
		fireEvent.click(screen.getByText('Задача из API'))
		expect(screen.getByRole('dialog').getAttribute('data-readonly')).toBe('true')
		expect(screen.getByText('Описание из API')).toBeDefined()
		expect(screen.getByText('7')).toBeDefined()
		fireEvent.click(screen.getByText('Закрыть'))
		expect(screen.queryByRole('dialog')).toBeNull()
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
