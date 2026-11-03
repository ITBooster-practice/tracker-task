import { createBoardViewFixture } from '@/test/mocks/api/boards.fixtures'
import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardView, CreateTask, Task } from '@repo/types'

import { usePendingBoardTasks } from '@/views/boards/model/use-pending-board-tasks'
import { tasksKeys, useCreateTask } from '@/shared/api/use-tasks'

const assignee = { id: 'user-1', name: 'Анна Иванова', initials: 'АИ' }

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}

describe('usePendingBoardTasks', () => {
	let queryClient: QueryClient
	beforeEach(() => {
		resetTasksServiceMock()
		queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
	})
	afterEach(() => {
		cleanup()
		queryClient.clear()
	})

	function setup(view: BoardView = createBoardViewFixture()) {
		return renderHook(
			({ currentView = view, teamId = 'team-1', projectId = 'project-1' }) => ({
				pending: usePendingBoardTasks(teamId, projectId, currentView, [assignee]),
				create: useCreateTask(),
			}),
			{
				initialProps: { currentView: view, teamId: 'team-1', projectId: 'project-1' },
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
				),
			},
		)
	}

	it('shows every matching create independently and keeps local presentation out of the query cache', async () => {
		tasksServiceMock.create.mockImplementation(() => new Promise(() => undefined))
		const view = createBoardViewFixture()
		queryClient.setQueryData(tasksKeys.board('team-1', 'project-1', 'board-1'), view)
		const { result, rerender } = setup(view)
		const data: CreateTask = {
			title: 'Локальная карточка',
			boardColumnId: 'board-1-column',
			type: 'BUG',
			priority: 'HIGH',
			labels: ['UI'],
			dueDate: '2026-11-03T00:00:00.000Z',
			assigneeId: assignee.id,
		}
		act(() => {
			result.current.create.mutate({ teamId: 'team-1', projectId: 'project-1', data })
			result.current.create.mutate({ teamId: 'team-1', projectId: 'project-1', data })
			result.current.create.mutate({ teamId: 'other-team', projectId: 'project-1', data })
			result.current.create.mutate({ teamId: 'team-1', projectId: 'other-project', data })
		})
		await waitFor(() => expect(result.current.pending).toHaveLength(2))
		expect(new Set(result.current.pending.map((task) => task.localId)).size).toBe(2)
		expect(result.current.pending[0]).toEqual({
			...data,
			key: 'Локальная задача',
			assignee,
			localId: expect.any(String),
		})
		expect(
			queryClient.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
		).toBe(view)
		rerender({
			currentView: createBoardViewFixture('other-board'),
			teamId: 'team-1',
			projectId: 'project-1',
		})
		expect(result.current.pending).toEqual([])
		rerender({
			currentView: createBoardViewFixture('board-1', 'other-project'),
			teamId: 'team-1',
			projectId: 'project-1',
		})
		expect(result.current.pending).toEqual([])
	})

	it.each([
		{
			isDefault: false,
			isSystem: false,
			key: 'TODO',
			data: { boardColumnId: 'board-1-column' },
			visible: true,
		},
		{
			isDefault: true,
			isSystem: true,
			key: 'TODO',
			data: { boardColumnId: 'foreign-column' },
			visible: false,
		},
		{ isDefault: false, isSystem: true, key: 'TODO', data: {}, visible: false },
		{ isDefault: true, isSystem: false, key: 'TODO', data: {}, visible: false },
		{ isDefault: true, isSystem: true, key: 'TODO', data: {}, visible: true },
		{
			isDefault: true,
			isSystem: true,
			key: 'DONE',
			data: { status: 'DONE' as const },
			visible: true,
		},
		{
			isDefault: true,
			isSystem: true,
			key: 'TODO',
			data: { status: 'DONE' as const },
			visible: false,
		},
	])(
		'routes only to the current board ($isDefault / $isSystem / $key / $data)',
		async ({ isDefault, isSystem, key, data, visible }) => {
			tasksServiceMock.create.mockImplementation(() => new Promise(() => undefined))
			const view = createBoardViewFixture()
			view.board.isDefault = isDefault
			view.columns[0] = { ...view.columns[0]!, isSystem, key }
			const { result } = setup(view)
			act(() =>
				result.current.create.mutate({
					teamId: 'team-1',
					projectId: 'project-1',
					data: { title: 'Новая задача', ...data },
				}),
			)
			await waitFor(() => expect(result.current.create.isPending).toBe(true))
			await waitFor(() => expect(result.current.pending).toHaveLength(visible ? 1 : 0))
			if (visible)
				expect(result.current.pending[0]).toMatchObject({
					type: 'TASK',
					priority: 'MEDIUM',
					labels: [],
					dueDate: null,
					assigneeId: null,
					assignee: null,
				})
		},
	)

	it('keeps an unavailable assignee distinct from an unassigned task', async () => {
		tasksServiceMock.create.mockImplementation(() => new Promise(() => undefined))
		const { result } = setup()
		act(() =>
			result.current.create.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				data: {
					title: 'С назначением',
					boardColumnId: 'board-1-column',
					assigneeId: 'missing-person',
				},
			}),
		)
		await waitFor(() => expect(result.current.pending).toHaveLength(1))
		expect(result.current.pending[0]).toMatchObject({
			assigneeId: 'missing-person',
			assignee: { id: 'missing-person', name: 'Неизвестный пользователь', initials: '?' },
		})
	})

	it('removes failed previews while retaining variables for retry', async () => {
		const request = deferred<Task>()
		tasksServiceMock.create.mockReturnValueOnce(request.promise)
		const { result } = setup()
		const variables = {
			teamId: 'team-1',
			projectId: 'project-1',
			data: { title: 'Повторить', boardColumnId: 'board-1-column' },
		}
		act(() => result.current.create.mutate(variables))
		await waitFor(() => expect(result.current.pending).toHaveLength(1))
		await act(async () => request.reject(new Error('Offline')))
		await waitFor(() => expect(result.current.pending).toEqual([]))
		expect(result.current.create.isError).toBe(true)
		expect(result.current.create.variables).toEqual(variables)
	})

	it('hands off to the real query result after the successful refresh without keeping a duplicate', async () => {
		const request = deferred<Task>(),
			refresh = deferred<void>()
		tasksServiceMock.create.mockReturnValueOnce(request.promise)
		vi.spyOn(queryClient, 'invalidateQueries').mockReturnValue(refresh.promise)
		const { result, rerender } = setup()
		act(() =>
			result.current.create.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				data: { title: 'Сохранена', boardColumnId: 'board-1-column' },
			}),
		)
		await waitFor(() => expect(result.current.pending).toHaveLength(1))
		const task = createTaskFixture({ title: 'Сохранена' })
		await act(async () => request.resolve(task))
		expect(result.current.pending).toHaveLength(1)
		const view = createBoardViewFixture()
		view.columns[0]!.tasks = [task]
		rerender({ currentView: view, teamId: 'team-1', projectId: 'project-1' })
		expect(result.current.create.isPending).toBe(true)
		expect(result.current.pending).toEqual([])
		await act(async () => {
			queryClient.setQueryData(tasksKeys.board('team-1', 'project-1', 'board-1'), view)
			refresh.resolve()
		})
		rerender({ currentView: view, teamId: 'team-1', projectId: 'project-1' })
		await waitFor(() => expect(result.current.create.isSuccess).toBe(true))
		expect(result.current.pending).toEqual([])
		expect(
			queryClient.getQueryData<BoardView>(
				tasksKeys.board('team-1', 'project-1', 'board-1'),
			)!.columns[0]!.tasks,
		).toEqual([task])
	})
})
