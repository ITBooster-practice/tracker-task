import '@/test/mocks/api/tasks-service.mock'

import {
	createBoardTaskFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardView, Task, TaskMoveConflict } from '@repo/types'

import {
	tasksKeys,
	useBoardQuery,
	useMoveTask,
	useTaskDetail,
	useTasksList,
	useUpdateTask,
} from '@/shared/api/use-tasks'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise
		reject = rejectPromise
	})
	return { promise, resolve, reject }
}

const variables = {
	teamId: 'team-1',
	projectId: 'project-1',
	boardId: 'board-1',
	taskId: 'task-1',
	body: {
		fromColumnId: 'board-1-column',
		toColumnId: 'board-2-column',
		position: 0,
		expectedVersion: 0,
	},
}
const conflict: TaskMoveConflict = {
	statusCode: 409,
	code: 'TASK_MOVE_CONFLICT',
	taskId: 'task-1',
	reason: 'VERSION_MISMATCH',
	message: 'Task changed',
}

const movableView = (systemTarget = true) => {
	const view = createBoardViewFixture()
	const source = view.columns[0]!
	source.tasks.push(createBoardTaskFixture({ id: 'neighbor', position: 1 }))
	view.columns.push({
		...source,
		id: 'target',
		key: 'DONE',
		isSystem: systemTarget,
		tasks: [createBoardTaskFixture({ id: 'target-task', boardColumnId: 'target' })],
	})
	return view
}

const boardMove = {
	...variables,
	body: { ...variables.body, toColumnId: 'target', position: 1 },
}

describe('board task queries', () => {
	let client: QueryClient

	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	beforeEach(() => {
		resetTasksServiceMock()
		client = new QueryClient({
			defaultOptions: {
				queries: { retry: false, staleTime: Infinity },
				mutations: { retry: 2, retryDelay: 0 },
			},
		})
	})

	afterEach(() => {
		cleanup()
		client.clear()
	})

	it.each([
		['', 'project-1', 'board-1'],
		['team-1', '', 'board-1'],
		['team-1', 'project-1', ''],
	])(
		'не запрашивает доску без идентификаторов (%s, %s, %s)',
		(teamId, projectId, boardId) => {
			const { result } = renderHook(() => useBoardQuery(teamId, projectId, boardId), {
				wrapper: Wrapper,
			})
			expect(result.current.fetchStatus).toBe('idle')
			expect(tasksServiceMock.getBoard).not.toHaveBeenCalled()
		},
	)

	it('разделяет кэш досок и не показывает предыдущую доску при переключении', async () => {
		const first = createBoardViewFixture('board-1')
		const second = createBoardViewFixture('board-2')
		const pending = deferred<BoardView>()
		tasksServiceMock.getBoard
			.mockResolvedValueOnce(first)
			.mockReturnValueOnce(pending.promise)
		const { result, rerender } = renderHook(
			({ boardId }) => useBoardQuery('team-1', 'project-1', boardId),
			{
				wrapper: Wrapper,
				initialProps: { boardId: 'board-1' },
			},
		)
		await waitFor(() => expect(result.current.data).toEqual(first))
		expect(tasksServiceMock.getBoard).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'board-1',
			expect.any(AbortSignal),
		)

		rerender({ boardId: 'board-2' })
		expect(result.current.data).toBeUndefined()
		await act(async () => {
			pending.resolve(second)
		})
		await waitFor(() => expect(result.current.data).toEqual(second))
		expect(
			client.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
		).toEqual(first)
	})

	it.each(['success', 'conflict', 'network'] as const)(
		'после переноса (%s) инвалидирует все представления проекта, сохраняя чужой кэш',
		async (outcome) => {
			const affected = [
				tasksKeys.board('team-1', 'project-1', 'board-1'),
				tasksKeys.board('team-1', 'project-1', 'board-2'),
				tasksKeys.list('team-1', 'project-1'),
				tasksKeys.list('team-1', 'project-1', { status: 'DONE' }),
				tasksKeys.detail('team-1', 'project-1', 'task-1'),
				tasksKeys.detail('team-1', 'project-1', 'neighbor'),
			]
			const unaffected = [
				tasksKeys.board('team-2', 'project-1', 'board-1'),
				tasksKeys.board('team-1', 'project-2', 'board-1'),
				tasksKeys.list('team-1', 'project-2'),
				tasksKeys.detail('team-2', 'project-1', 'task-1'),
			]
			for (const key of [...affected, ...unaffected])
				client.setQueryData(key, { cached: true })
			client.setQueryData(affected[0]!, createBoardViewFixture())
			const error =
				outcome === 'conflict' ? conflict : { statusCode: 503, message: 'Network failed' }
			if (outcome === 'success')
				tasksServiceMock.move.mockResolvedValue(createBoardTaskFixture())
			else tasksServiceMock.move.mockRejectedValue(error)

			const { result } = renderHook(() => useMoveTask(), { wrapper: Wrapper })
			act(() => result.current.mutate(variables))
			await waitFor(() =>
				expect(result.current.isSuccess || result.current.isError).toBe(true),
			)

			expect(tasksServiceMock.move).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'task-1',
				variables.body,
			)
			if (outcome !== 'success') expect(result.current.error).toBe(error)
			for (const key of affected)
				expect(client.getQueryState(key)?.isInvalidated).toBe(true)
			for (const key of unaffected)
				expect(client.getQueryState(key)?.isInvalidated).toBe(false)
		},
	)

	it('дожидается обновления активных досок, списка и версий соседних задач', async () => {
		const pendingNeighbor = deferred<Task>()
		const source = createBoardViewFixture('board-1')
		const target = createBoardViewFixture('board-2')
		const task = createBoardTaskFixture({ version: 1, boardColumnId: 'board-2-column' })
		const neighbor = createTaskFixture({ id: 'neighbor', version: 1 })
		source.columns[0]!.tasks = []
		target.columns[0]!.tasks = [task]
		client.setQueryData(
			tasksKeys.board('team-1', 'project-1', 'board-1'),
			createBoardViewFixture('board-1'),
		)
		client.setQueryData(
			tasksKeys.board('team-1', 'project-1', 'board-2'),
			createBoardViewFixture('board-2'),
		)
		client.setQueryData(tasksKeys.list('team-1', 'project-1'), {
			data: [],
			meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
		})
		client.setQueryData(
			tasksKeys.detail('team-1', 'project-1', 'task-1'),
			createTaskFixture(),
		)
		client.setQueryData(
			tasksKeys.detail('team-1', 'project-1', 'neighbor'),
			createTaskFixture({ id: 'neighbor' }),
		)
		tasksServiceMock.getBoard.mockImplementation(async (_, __, boardId) =>
			boardId === 'board-1' ? source : target,
		)
		tasksServiceMock.getAll.mockResolvedValue({
			data: [task, neighbor],
			meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
		})
		tasksServiceMock.getById.mockImplementation(async (_, __, taskId) =>
			taskId === 'neighbor' ? pendingNeighbor.promise : task,
		)
		tasksServiceMock.move.mockResolvedValue(task)
		const { result } = renderHook(
			() => ({
				source: useBoardQuery('team-1', 'project-1', 'board-1'),
				target: useBoardQuery('team-1', 'project-1', 'board-2'),
				list: useTasksList('team-1', 'project-1'),
				task: useTaskDetail('team-1', 'project-1', 'task-1'),
				neighbor: useTaskDetail('team-1', 'project-1', 'neighbor'),
				move: useMoveTask(),
			}),
			{ wrapper: Wrapper },
		)

		act(() => result.current.move.mutate(variables))
		await waitFor(() => expect(result.current.task.data?.version).toBe(1))
		expect(result.current.move.isPending).toBe(true)
		await act(async () => {
			pendingNeighbor.resolve(neighbor)
		})
		await waitFor(() => expect(result.current.move.isSuccess).toBe(true))
		expect(result.current.source.data).toEqual(source)
		expect(result.current.target.data).toEqual(target)
		expect(result.current.list.data?.data).toEqual([task, neighbor])
		expect(result.current.neighbor.data?.version).toBe(1)
	})

	it('отменяет старый GET доски перед обновлением после переноса', async () => {
		const oldRequest = deferred<BoardView>()
		const fresh = createBoardViewFixture()
		fresh.columns[0]!.tasks = []
		tasksServiceMock.getBoard
			.mockReturnValueOnce(oldRequest.promise)
			.mockResolvedValue(fresh)
		tasksServiceMock.move.mockResolvedValue(createBoardTaskFixture({ version: 1 }))
		const { result } = renderHook(
			() => ({
				board: useBoardQuery('team-1', 'project-1', 'board-1'),
				move: useMoveTask(),
			}),
			{ wrapper: Wrapper },
		)
		const signal = tasksServiceMock.getBoard.mock.calls[0]![3]!
		act(() => result.current.move.mutate(variables))
		await waitFor(() => expect(result.current.move.isSuccess).toBe(true))
		expect(signal.aborted).toBe(true)
		expect(result.current.board.data).toEqual(fresh)
		await act(async () => {
			oldRequest.resolve(createBoardViewFixture())
		})
		expect(
			client.getQueryData(tasksKeys.board('team-1', 'project-1', 'board-1')),
		).toEqual(fresh)
	})

	it('запоздавший PATCH не затирает новую версию задачи после переноса', async () => {
		const oldUpdate = deferred<Task>()
		const latest = createTaskFixture({ version: 2, title: 'Updated and moved' })
		const key = tasksKeys.detail('team-1', 'project-1', 'task-1')
		client.setQueryData(key, createTaskFixture())
		tasksServiceMock.update.mockReturnValue(oldUpdate.promise)
		tasksServiceMock.move.mockResolvedValue(createBoardTaskFixture({ version: 2 }))
		tasksServiceMock.getById.mockResolvedValue(latest)
		const { result } = renderHook(
			() => ({
				detail: useTaskDetail('team-1', 'project-1', 'task-1'),
				update: useUpdateTask(),
				move: useMoveTask(),
			}),
			{ wrapper: Wrapper },
		)
		const observedVersions: number[] = []
		const unsubscribe = client.getQueryCache().subscribe(() => {
			observedVersions.push(client.getQueryData<Task>(key)!.version)
		})
		act(() =>
			result.current.update.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				taskId: 'task-1',
				data: { title: 'Updated' },
			}),
		)
		act(() => result.current.move.mutate(variables))
		await waitFor(() => expect(result.current.move.isSuccess).toBe(true))
		expect(result.current.detail.data?.version).toBe(2)
		await act(async () => {
			oldUpdate.resolve(createTaskFixture({ version: 1, title: 'Updated' }))
		})
		await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
		unsubscribe()
		expect(observedVersions).not.toContain(1)
		expect(result.current.detail.data).toEqual(latest)
	})

	it.each([true, false])(
		'оптимистично переносит карточку и сохраняет серверную версию (system=%s)',
		async (systemTarget) => {
			const original = movableView(systemTarget)
			const snapshot = structuredClone(original)
			const key = tasksKeys.board('team-1', 'project-1', 'board-1')
			const otherKey = tasksKeys.board('team-1', 'project-2', 'board-1')
			client.setQueryData(key, original)
			client.setQueryData(otherKey, original)
			const pending = deferred<ReturnType<typeof createBoardTaskFixture>>()
			tasksServiceMock.move.mockReturnValueOnce(pending.promise)
			const { result } = renderHook(() => useMoveTask(), { wrapper: Wrapper })
			act(() => result.current.mutate(boardMove))
			await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
			const optimistic = client.getQueryData<BoardView>(key)!
			expect(result.current.isPending).toBe(true)
			expect(
				optimistic.columns[0]!.tasks.map((task) => [task.id, task.position]),
			).toEqual([['neighbor', 0]])
			expect(
				optimistic.columns[1]!.tasks.map((task) => [task.id, task.position]),
			).toEqual([
				['target-task', 0],
				['task-1', 1],
			])
			expect(optimistic.columns[1]!.tasks[1]).toMatchObject({
				boardColumnId: 'target',
				status: systemTarget ? 'DONE' : snapshot.columns[0]!.tasks[0]!.status,
			})
			expect(original).toEqual(snapshot)
			expect(client.getQueryData(otherKey)).toEqual(snapshot)
			await act(async () =>
				pending.resolve({ ...optimistic.columns[1]!.tasks[1]!, version: 1 }),
			)
			await waitFor(() => expect(result.current.isSuccess).toBe(true))
			expect(client.getQueryData<BoardView>(key)!.columns[1]!.tasks[1]!.version).toBe(1)
		},
	)

	it('переставляет вниз в той же колонке по конечному индексу без повторного вычитания', async () => {
		const original = movableView()
		const key = tasksKeys.board('team-1', 'project-1', 'board-1')
		client.setQueryData(key, original)
		const pending = deferred<ReturnType<typeof createBoardTaskFixture>>()
		tasksServiceMock.move.mockReturnValueOnce(pending.promise)
		const { result } = renderHook(() => useMoveTask(), { wrapper: Wrapper })
		act(() =>
			result.current.mutate({
				...variables,
				body: { ...variables.body, toColumnId: 'board-1-column', position: 1 },
			}),
		)
		await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
		expect(
			client
				.getQueryData<BoardView>(key)!
				.columns[0]!.tasks.map((task) => [task.id, task.position]),
		).toEqual([
			['neighbor', 0],
			['task-1', 1],
		])
		await act(async () =>
			pending.resolve(createBoardTaskFixture({ position: 1, version: 1 })),
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
	})

	it.each([conflict, { statusCode: 503, message: 'Network failed' }])(
		'откатывает исходную доску до уведомления об ошибке $statusCode',
		async (error) => {
			const original = movableView()
			const key = tasksKeys.board('team-1', 'project-1', 'board-1')
			client.setQueryData(key, original)
			const pending = deferred<ReturnType<typeof createBoardTaskFixture>>()
			tasksServiceMock.move.mockReturnValueOnce(pending.promise)
			const onError = vi.fn(() => expect(client.getQueryData(key)).toEqual(original))
			const { result } = renderHook(() => useMoveTask({ onError }), { wrapper: Wrapper })
			act(() => result.current.mutate(boardMove))
			await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
			expect(client.getQueryData<BoardView>(key)!.columns[0]!.tasks).toHaveLength(1)
			await act(async () => pending.reject(error))
			await waitFor(() => expect(result.current.isError).toBe(true))
			expect(client.getQueryData(key)).toEqual(original)
			expect(result.current.error).toEqual(error)
			expect(onError).toHaveBeenCalledExactlyOnceWith(error)
			expect(tasksServiceMock.move).toHaveBeenCalledTimes(1)
		},
	)

	it('откат не затирает более свежие данные, полученные во время переноса', async () => {
		const key = tasksKeys.board('team-1', 'project-1', 'board-1')
		client.setQueryData(key, movableView())
		const pending = deferred<ReturnType<typeof createBoardTaskFixture>>()
		tasksServiceMock.move.mockReturnValueOnce(pending.promise)
		const { result } = renderHook(() => useMoveTask(), { wrapper: Wrapper })
		act(() => result.current.mutate(boardMove))
		await waitFor(() => expect(tasksServiceMock.move).toHaveBeenCalledTimes(1))
		const fresh = movableView()
		fresh.columns[0]!.tasks[0]!.title = 'Новое изменение другого пользователя'
		fresh.columns[0]!.tasks[0]!.version = 5
		client.setQueryData(key, fresh)
		await act(async () => pending.reject(conflict))
		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(client.getQueryData(key)).toEqual(fresh)
	})

	it('ошибка обновления доски не подменяет конфликт переноса', async () => {
		client.setQueryData(
			tasksKeys.board('team-1', 'project-1', 'board-1'),
			createBoardViewFixture(),
		)
		tasksServiceMock.getBoard.mockRejectedValue({
			statusCode: 503,
			message: 'Unavailable',
		})
		tasksServiceMock.move.mockRejectedValue(conflict)
		const { result } = renderHook(
			() => ({
				board: useBoardQuery('team-1', 'project-1', 'board-1'),
				move: useMoveTask(),
			}),
			{ wrapper: Wrapper },
		)
		act(() => result.current.move.mutate(variables))
		await waitFor(() => expect(result.current.move.isError).toBe(true))
		expect(result.current.move.error).toBe(conflict)
		expect(result.current.board.error?.statusCode).toBe(503)
		expect(tasksServiceMock.move).toHaveBeenCalledTimes(1)
	})
})
