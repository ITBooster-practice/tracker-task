import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
	boardsKeys,
	useArchiveBoard,
	useBoardsList,
	useCreateBoard,
	useUpdateBoard,
} from '@/shared/api/use-boards'
import { taskLabelsKeys } from '@/shared/api/use-task-labels'
import { tasksKeys } from '@/shared/api/use-tasks'

beforeEach(() => {
	boardsServiceMock.getAll.mockReset()
	boardsServiceMock.create.mockReset()
	boardsServiceMock.update.mockReset()
	boardsServiceMock.archive.mockReset()
})

it('архивирует доску, очищает данные её проекта и уведомляет до изменения кэша', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const listKey = boardsKeys.list('team-1', 'project-1')
	const boardKey = tasksKeys.board('team-1', 'project-1', 'board-1')
	const otherBoardKey = tasksKeys.board('team-1', 'project-1', 'other')
	const listTasksKey = tasksKeys.list('team-1', 'project-1')
	const detailKey = tasksKeys.detail('team-1', 'project-1', 'task-1')
	const labelsKey = taskLabelsKeys.list('team-1', 'project-1', '')
	const foreign = tasksKeys.detail('team-2', 'project-1', 'task-1')
	const board = createBoardListItemFixture({ isDefault: true })
	const other = createBoardListItemFixture({ id: 'other' })
	client.setQueryData(listKey, [board, other])
	for (const key of [
		boardKey,
		otherBoardKey,
		listTasksKey,
		detailKey,
		labelsKey,
		foreign,
	])
		client.setQueryData(key, { present: true })
	const archived = vi.fn(() => {
		expect(client.getQueryData(listKey)).toEqual([board, other])
		expect(client.getQueryData(boardKey)).toEqual({ present: true })
	})
	boardsServiceMock.archive.mockResolvedValue(undefined)
	const { result, unmount } = renderHook(
		() => useArchiveBoard({ onArchived: archived }),
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={client}>{children}</QueryClientProvider>
			),
		},
	)
	await act(async () => {
		await result.current.mutateAsync({
			teamId: 'team-1',
			projectId: 'project-1',
			boardId: board.id,
			data: { expectedUpdatedAt: board.updatedAt },
		})
	})
	expect(boardsServiceMock.archive).toHaveBeenCalledExactlyOnceWith(
		'team-1',
		'project-1',
		board.id,
		{ expectedUpdatedAt: board.updatedAt },
	)
	expect(archived).toHaveBeenCalledOnce()
	expect(client.getQueryData(listKey)).toEqual([other])
	expect(client.getQueryData(boardKey)).toBeUndefined()
	expect(client.getQueryData(detailKey)).toBeUndefined()
	for (const key of [listKey, otherBoardKey, listTasksKey, labelsKey])
		expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	expect(client.getQueryData(foreign)).toEqual({ present: true })
	expect(client.getQueryState(foreign)?.isInvalidated).toBe(false)
	unmount()
	client.clear()
})

it('отменяет запоздалые ответы доски и деталей задач при архивации', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const keys = [
		tasksKeys.board('team-1', 'project-1', 'board-1'),
		tasksKeys.detail('team-1', 'project-1', 'task-1'),
	]
	const signals: AbortSignal[] = []
	let resolve!: (value: object) => void
	const slow = new Promise<object>((done) => {
		resolve = done
	})
	const fetches = keys.map((queryKey) =>
		client
			.fetchQuery({
				queryKey,
				queryFn: ({ signal }) => {
					signals.push(signal)
					return slow
				},
			})
			.catch(() => undefined),
	)
	boardsServiceMock.archive.mockResolvedValue(undefined)
	const { result, unmount } = renderHook(() => useArchiveBoard(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
	await act(async () => {
		await result.current.mutateAsync({
			teamId: 'team-1',
			projectId: 'project-1',
			boardId: 'board-1',
			data: { expectedUpdatedAt: '2026-01-01T00:00:00.000Z' },
		})
	})
	expect(signals).toHaveLength(2)
	expect(signals.every((signal) => signal.aborted)).toBe(true)
	resolve({ stale: true })
	await Promise.all(fetches)
	for (const queryKey of keys) expect(client.getQueryData(queryKey)).toBeUndefined()
	unmount()
	client.clear()
})

it('обновляет настройки и задачи только выбранного проекта', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const key = boardsKeys.list('team-1', 'project-1')
	const boardKey = tasksKeys.board('team-1', 'project-1', 'board-1')
	const detailKey = tasksKeys.detail('team-1', 'project-1', 'task-1')
	const foreign = tasksKeys.board('team-2', 'project-1', 'board-1')
	const original = createBoardListItemFixture()
	const saved = { ...original, name: 'Новое имя', description: 'Контекст' }
	client.setQueryData(key, [original])
	for (const queryKey of [boardKey, detailKey, foreign])
		client.setQueryData(queryKey, { unchanged: true })
	boardsServiceMock.update.mockResolvedValue(saved)
	const { result, unmount } = renderHook(() => useUpdateBoard(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
	await act(async () => {
		await result.current.mutateAsync({
			teamId: 'team-1',
			projectId: 'project-1',
			boardId: 'board-1',
			data: { name: saved.name, description: saved.description },
		})
	})
	expect(client.getQueryData(key)).toEqual([saved])
	expect(client.getQueryState(boardKey)?.isInvalidated).toBe(true)
	expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true)
	expect(client.getQueryState(foreign)?.isInvalidated).toBe(false)
	unmount()
	client.clear()
})

it('добавляет созданную доску только в список её проекта и помечает его для обновления', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const key = boardsKeys.list('team-1', 'project-1')
	const unrelated = boardsKeys.list('team-2', 'project-1')
	const main = createBoardListItemFixture({ isDefault: true })
	const created = createBoardListItemFixture({ id: 'created', taskCount: 0 })
	client.setQueryData(key, [main])
	client.setQueryData(unrelated, [main])
	boardsServiceMock.create.mockResolvedValue(created)
	const { result, unmount } = renderHook(() => useCreateBoard(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
	await act(async () => {
		await result.current.mutateAsync({
			teamId: 'team-1',
			projectId: 'project-1',
			data: { name: 'Новая' },
		})
	})
	expect(client.getQueryData(key)).toEqual([main, created])
	expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	expect(client.getQueryData(unrelated)).toEqual([main])
	expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false)
	unmount()
	client.clear()
})

afterEach(cleanup)

it.each([
	['', 'project-1'],
	['team-1', ''],
])('не загружает список досок без контекста (%s, %s)', (teamId, projectId) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)
	const { result, unmount } = renderHook(() => useBoardsList(teamId, projectId), {
		wrapper: Wrapper,
	})
	expect(result.current.fetchStatus).toBe('idle')
	expect(boardsServiceMock.getAll).not.toHaveBeenCalled()
	unmount()
	client.clear()
})
