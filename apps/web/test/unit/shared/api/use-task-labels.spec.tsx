import '@/test/mocks/api/tasks-service.mock'

import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { taskLabelsKeys, useTaskLabels } from '@/shared/api/use-task-labels'

describe('useTaskLabels', () => {
	let client: QueryClient
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	beforeEach(() => {
		resetTasksServiceMock()
		client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	})
	afterEach(() => {
		cleanup()
		client.clear()
	})

	it('передаёт поиск и сигнал отмены и разделяет каталоги проектов', async () => {
		tasksServiceMock.getLabels.mockImplementation(async (_team, project) =>
			project === 'project-1' ? ['Frontend'] : ['Other'],
		)
		const { result, rerender } = renderHook(
			({ project }) => useTaskLabels('team-1', project, 'front'),
			{ initialProps: { project: 'project-1' }, wrapper: Wrapper },
		)
		await waitFor(() => expect(result.current.data).toEqual(['Frontend']))
		expect(tasksServiceMock.getLabels).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'front',
			expect.any(AbortSignal),
		)

		rerender({ project: 'project-2' })
		expect(result.current.data).toBeUndefined()
		await waitFor(() => expect(result.current.data).toEqual(['Other']))
		expect(
			client.getQueryData(taskLabelsKeys.list('team-1', 'project-1', 'front')),
		).toEqual(['Frontend'])
		expect(
			client.getQueryData(taskLabelsKeys.list('team-1', 'project-2', 'front')),
		).toEqual(['Other'])
	})

	it('сохраняет подсказки текущего проекта до завершения нового поиска', async () => {
		let finishSearch!: (labels: string[]) => void
		const search = new Promise<string[]>((resolve) => {
			finishSearch = resolve
		})
		tasksServiceMock.getLabels
			.mockResolvedValueOnce(['Frontend', 'refactor'])
			.mockReturnValueOnce(search)
		const { result, rerender } = renderHook(
			({ search }) => useTaskLabels('team-1', 'project-1', search),
			{ initialProps: { search: '' }, wrapper: Wrapper },
		)
		await waitFor(() => expect(result.current.data).toEqual(['Frontend', 'refactor']))
		rerender({ search: 'front' })
		expect(result.current.isFetching).toBe(true)
		expect(result.current.isPending).toBe(false)
		expect(result.current.data).toEqual(['Frontend', 'refactor'])
		await act(async () => finishSearch(['Frontend']))
		await waitFor(() => expect(result.current.isFetching).toBe(false))
		expect(result.current.data).toEqual(['Frontend'])
	})

	it('повторно использует каталог для эквивалентного регистра и пробелов поиска', async () => {
		tasksServiceMock.getLabels.mockResolvedValue(['Café'])
		const { result, rerender } = renderHook(
			({ search }) => useTaskLabels('team-1', 'project-1', search),
			{ initialProps: { search: 'Café' }, wrapper: Wrapper },
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(tasksServiceMock.getLabels).toHaveBeenCalledWith(
			'team-1',
			'project-1',
			'café',
			expect.any(AbortSignal),
		)
		rerender({ search: '  CAFE\u0301  ' })
		expect(result.current.data).toEqual(['Café'])
		expect(tasksServiceMock.getLabels).toHaveBeenCalledTimes(1)
	})

	it.each([
		['', 'project-1'],
		['team-1', ''],
	])('не запрашивает метки без области %s/%s', (teamId, projectId) => {
		const { result } = renderHook(() => useTaskLabels(teamId, projectId, ''), {
			wrapper: Wrapper,
		})
		expect(tasksServiceMock.getLabels).not.toHaveBeenCalled()
		expect(result.current.fetchStatus).toBe('idle')
	})
})
