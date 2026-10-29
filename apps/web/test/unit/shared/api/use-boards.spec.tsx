import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import {
	createBoardListItemFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'

import {
	boardsKeys,
	useBoardsList,
	useCreateBoard,
	useDeleteBoard,
} from '@/shared/api/use-boards'
import { tasksKeys } from '@/shared/api/use-tasks'

beforeEach(() => {
	boardsServiceMock.getAll.mockReset()
	boardsServiceMock.create.mockReset()
	boardsServiceMock.delete.mockReset()
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

it('отменяет загрузку удалённой доски и не возвращает её в кэш запоздавшим ответом', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const key = boardsKeys.list('team-1', 'project-1')
	const boardKey = tasksKeys.board('team-1', 'project-1', 'deleted')
	const otherKey = tasksKeys.board('team-1', 'project-1', 'other')
	const board = createBoardListItemFixture({ id: 'deleted', taskCount: 0 })
	const other = createBoardViewFixture('other')
	let resolve!: (value: ReturnType<typeof createBoardViewFixture>) => void
	const slow = new Promise<ReturnType<typeof createBoardViewFixture>>((done) => {
		resolve = done
	})
	let signal!: AbortSignal
	const fetch = client
		.fetchQuery({
			queryKey: boardKey,
			queryFn: (context) => {
				signal = context.signal
				return slow
			},
		})
		.catch(() => undefined)
	client.setQueryData(key, [board])
	client.setQueryData(otherKey, other)
	boardsServiceMock.delete.mockResolvedValue(undefined)
	const { result, unmount } = renderHook(() => useDeleteBoard(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
	await act(async () => {
		await result.current.mutateAsync({
			teamId: 'team-1',
			projectId: 'project-1',
			boardId: 'deleted',
		})
	})
	expect(signal.aborted).toBe(true)
	resolve(createBoardViewFixture('deleted'))
	await fetch
	expect(client.getQueryData(key)).toEqual([])
	expect(client.getQueryData(boardKey)).toBeUndefined()
	expect(client.getQueryData(otherKey)).toEqual(other)
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
