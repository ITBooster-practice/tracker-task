import '@/test/mocks/api/board-columns-service.mock'
import '@/test/mocks/api/tasks-service.mock'

import {
	boardColumnsServiceMock,
	resetBoardColumnsServiceMock,
} from '@/test/mocks/api/board-columns-service.mock'
import {
	createBoardListItemFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'

import type { BoardView } from '@repo/types'

import { boardsKeys } from '@/shared/api/boards-keys'
import {
	useCreateBoardColumn,
	useDeleteBoardColumn,
	useReorderBoardColumns,
	useUpdateBoardColumn,
} from '@/shared/api/use-board-columns'
import { tasksKeys, useBoardQuery } from '@/shared/api/use-tasks'

const context = { teamId: 'team-1', projectId: 'project-1', boardId: 'board-1' }
let client: QueryClient
const Wrapper = ({ children }: React.PropsWithChildren) => (
	<QueryClientProvider client={client}>{children}</QueryClientProvider>
)
beforeEach(() => {
	resetBoardColumnsServiceMock()
	resetTasksServiceMock()
	client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, staleTime: Infinity },
			mutations: { retry: false },
		},
	})
})
afterEach(() => {
	cleanup()
	client.clear()
})

it('удаление обновляет задачи, детали и доски только текущего проекта', async () => {
	const keys = [
		tasksKeys.board('team-1', 'project-1', 'board-1'),
		tasksKeys.board('team-1', 'project-1', 'other-board'),
		tasksKeys.list('team-1', 'project-1'),
		tasksKeys.detail('team-1', 'project-1', 'task'),
		boardsKeys.list('team-1', 'project-1'),
	]
	const foreign = [
		tasksKeys.board('team-2', 'project-1', 'board-1'),
		tasksKeys.list('team-1', 'other-project'),
		tasksKeys.detail('team-1', 'other-project', 'task'),
		boardsKeys.list('team-1', 'other-project'),
	]
	for (const key of [...keys, ...foreign]) client.setQueryData(key, { cached: true })
	boardColumnsServiceMock.delete.mockResolvedValue(undefined)
	const { result } = renderHook(() => useDeleteBoardColumn(), { wrapper: Wrapper })
	await act(async () => {
		await result.current.mutateAsync({
			...context,
			columnId: 'source',
			data: { targetColumnId: 'target' },
		})
	})
	expect(boardColumnsServiceMock.delete).toHaveBeenCalledExactlyOnceWith(
		'board-1',
		'source',
		{ targetColumnId: 'target' },
	)
	for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	for (const key of foreign) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
})

it('перестановка обновляет только свою доску и список, не меняя задачи в кеше', async () => {
	const key = tasksKeys.board('team-1', 'project-1', 'board-1')
	const list = boardsKeys.list('team-1', 'project-1')
	const other = tasksKeys.board('team-1', 'project-1', 'other')
	const task = tasksKeys.detail('team-1', 'project-1', 'task')
	for (const queryKey of [key, list, other, task])
		client.setQueryData(queryKey, { cached: true })
	boardColumnsServiceMock.reorder.mockResolvedValue([])
	const { result } = renderHook(() => useReorderBoardColumns(), { wrapper: Wrapper })
	await act(async () => {
		await result.current.mutateAsync({
			...context,
			data: { columnIds: ['second', 'first'] },
		})
	})
	expect(boardColumnsServiceMock.reorder).toHaveBeenCalledExactlyOnceWith('board-1', {
		columnIds: ['second', 'first'],
	})
	expect(client.getQueryState(key)?.isInvalidated).toBe(true)
	expect(client.getQueryState(list)?.isInvalidated).toBe(true)
	for (const queryKey of [other, task])
		expect(client.getQueryState(queryKey)?.isInvalidated).toBe(false)
	expect(client.getQueryData(key)).toEqual({ cached: true })
})

it.each([400, 403, 404, 409, 503])(
	'ошибка изменения структуры %s сохраняет кеш и обновляет его при конфликте',
	async (statusCode) => {
		const key = tasksKeys.board('team-1', 'project-1', 'board-1')
		const view = createBoardViewFixture()
		client.setQueryData(key, view)
		const error = { statusCode, message: 'API error' }
		boardColumnsServiceMock.reorder.mockRejectedValue(error)
		boardColumnsServiceMock.delete.mockRejectedValue(error)
		const { result } = renderHook(
			() => ({ reorder: useReorderBoardColumns(), remove: useDeleteBoardColumn() }),
			{ wrapper: Wrapper },
		)
		await act(async () => {
			await expect(
				result.current.reorder.mutateAsync({ ...context, data: { columnIds: ['id'] } }),
			).rejects.toEqual(error)
			await expect(
				result.current.remove.mutateAsync({
					...context,
					columnId: 'source',
					data: { targetColumnId: 'target' },
				}),
			).rejects.toEqual(error)
		})
		expect(client.getQueryData(key)).toEqual(view)
		await waitFor(() =>
			expect(client.getQueryState(key)?.isInvalidated).toBe(
				[400, 404, 409].includes(statusCode),
			),
		)
	},
)

it.each(['create', 'update'] as const)(
	'%s обновляет только выбранную доску и список её проекта',
	async (operation) => {
		const boardKey = tasksKeys.board(context.teamId, context.projectId, context.boardId)
		const otherKey = tasksKeys.board(context.teamId, context.projectId, 'other')
		const foreignKey = tasksKeys.board('team-2', context.projectId, context.boardId)
		const listKey = boardsKeys.list(context.teamId, context.projectId)
		const otherList = boardsKeys.list(context.teamId, 'other-project')
		const view = createBoardViewFixture()
		const list = [createBoardListItemFixture()]
		for (const key of [boardKey, otherKey, foreignKey]) client.setQueryData(key, view)
		client.setQueryData(listKey, list)
		client.setQueryData(otherList, list)
		const column = list[0]!.columns[0]!
		boardColumnsServiceMock.create.mockResolvedValue(column)
		boardColumnsServiceMock.update.mockResolvedValue(column)
		const { result } = renderHook(
			() => ({ create: useCreateBoardColumn(), update: useUpdateBoardColumn() }),
			{ wrapper: Wrapper },
		)
		await act(async () => {
			if (operation === 'create')
				await result.current.create.mutateAsync({
					...context,
					data: { key: 'column_random', title: 'Проверка' },
				})
			else
				await result.current.update.mutateAsync({
					...context,
					columnId: column.id,
					data: { title: 'Проверка' },
				})
		})
		expect(client.getQueryState(boardKey)?.isInvalidated).toBe(true)
		expect(client.getQueryState(listKey)?.isInvalidated).toBe(true)
		for (const key of [otherKey, foreignKey, otherList])
			expect(client.getQueryState(key)?.isInvalidated).toBe(false)
		expect(client.getQueryData(otherKey)).toEqual(view)
		if (operation === 'create')
			expect(boardColumnsServiceMock.create).toHaveBeenCalledExactlyOnceWith('board-1', {
				key: 'column_random',
				title: 'Проверка',
			})
		else
			expect(boardColumnsServiceMock.update).toHaveBeenCalledExactlyOnceWith(
				'board-1',
				column.id,
				{ title: 'Проверка' },
			)
	},
)

it('отменяет устаревший запрос доски перед обновлением и не возвращает старое название', async () => {
	const before = createBoardViewFixture()
	const fresh = structuredClone(before)
	fresh.columns[0]!.title = 'Новое название'
	let resolve!: (value: BoardView) => void
	const slow = new Promise<BoardView>((done) => {
		resolve = done
	})
	const key = tasksKeys.board('team-1', 'project-1', 'board-1')
	client.setQueryData(key, before)
	tasksServiceMock.getBoard.mockReturnValueOnce(slow).mockResolvedValue(fresh)
	boardColumnsServiceMock.update.mockResolvedValue(
		createBoardListItemFixture().columns[0]!,
	)
	const { result } = renderHook(
		() => ({
			board: useBoardQuery('team-1', 'project-1', 'board-1'),
			update: useUpdateBoardColumn(),
		}),
		{ wrapper: Wrapper },
	)
	act(() => {
		void result.current.board.refetch()
	})
	await waitFor(() => expect(tasksServiceMock.getBoard).toHaveBeenCalledTimes(1))
	const signal = tasksServiceMock.getBoard.mock.calls[0]![3]!
	await act(async () => {
		await result.current.update.mutateAsync({
			...context,
			columnId: before.columns[0]!.id,
			data: { title: 'Новое название' },
		})
	})
	expect(signal.aborted).toBe(true)
	await waitFor(() => expect(result.current.board.data).toEqual(fresh))
	await act(async () => resolve(before))
	expect(client.getQueryData(key)).toEqual(fresh)
})

it.each([403, 409, 404])(
	'обрабатывает ошибку %s без потери данных доски',
	async (statusCode) => {
		const key = tasksKeys.board('team-1', 'project-1', 'board-1')
		const view = createBoardViewFixture()
		client.setQueryData(key, view)
		const error = { statusCode, message: 'API error' }
		boardColumnsServiceMock.create.mockRejectedValue(error)
		const { result } = renderHook(() => useCreateBoardColumn(), { wrapper: Wrapper })
		await act(async () => {
			await expect(
				result.current.mutateAsync({
					...context,
					data: { key: 'random', title: 'Проверка' },
				}),
			).rejects.toEqual(error)
		})
		expect(client.getQueryData(key)).toEqual(view)
		if (statusCode === 403) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
		else await waitFor(() => expect(client.getQueryState(key)?.isInvalidated).toBe(true))
	},
)
