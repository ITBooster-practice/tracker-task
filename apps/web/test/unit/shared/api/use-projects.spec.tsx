import '@/test/mocks/api/projects-service.mock'

import {
	projectsServiceMock,
	resetProjectsServiceMock,
} from '@/test/mocks/api/projects-service.mock'
import { createProjectFixture } from '@/test/mocks/api/projects.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	projectsKeys,
	useCreateProject,
	useDeleteProject,
	useProjectDetail,
	useProjectsList,
	useUpdateProject,
} from '@/shared/api/use-projects'

describe('use-projects hooks', () => {
	let queryClient: QueryClient

	const createWrapper = () => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		const QueryClientWrapper = ({ children }: React.PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		QueryClientWrapper.displayName = 'UseProjectsQueryClientWrapper'

		return QueryClientWrapper
	}

	beforeEach(() => {
		resetProjectsServiceMock()
	})

	describe('useProjectsList', () => {
		it('запрашивает список проектов по teamId', async () => {
			const projects = [
				createProjectFixture({ id: 'project-1', name: 'Alpha' }),
				createProjectFixture({ id: 'project-2', name: 'Beta' }),
			]
			const paginatedResponse = {
				data: projects,
				meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
			}

			projectsServiceMock.getAll.mockResolvedValue(paginatedResponse)

			const { result } = renderHook(() => useProjectsList('team-1'), {
				wrapper: createWrapper(),
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(projectsServiceMock.getAll).toHaveBeenCalledWith('team-1')
			expect(result.current.data).toEqual(paginatedResponse)
		})

		it('не делает запрос, если teamId пустой', () => {
			const { result } = renderHook(() => useProjectsList(''), {
				wrapper: createWrapper(),
			})

			expect(projectsServiceMock.getAll).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})
	})

	describe('useProjectDetail', () => {
		it('запрашивает проект по teamId и projectId', async () => {
			const project = createProjectFixture({ id: 'project-1', name: 'Alpha' })

			projectsServiceMock.getById.mockResolvedValue(project)

			const { result } = renderHook(() => useProjectDetail('team-1', 'project-1'), {
				wrapper: createWrapper(),
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(projectsServiceMock.getById).toHaveBeenCalledWith('team-1', 'project-1')
			expect(result.current.data).toEqual(project)
		})

		it('не делает запрос, если teamId пустой', () => {
			const { result } = renderHook(() => useProjectDetail('', 'project-1'), {
				wrapper: createWrapper(),
			})

			expect(projectsServiceMock.getById).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})

		it('не делает запрос, если projectId пустой', () => {
			const { result } = renderHook(() => useProjectDetail('team-1', ''), {
				wrapper: createWrapper(),
			})

			expect(projectsServiceMock.getById).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})
	})

	describe('useCreateProject', () => {
		it('после создания обновляет кэш (setQueryData) и инвалидирует список', async () => {
			const project = createProjectFixture({ id: 'project-1', name: 'New Project' })

			projectsServiceMock.create.mockResolvedValue(project)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useCreateProject(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({ teamId: 'team-1', data: { name: 'New Project' } })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(projectsServiceMock.create).toHaveBeenCalledWith('team-1', {
				name: 'New Project',
			})
			expect(
				queryClient.getQueryData(projectsKeys.detail('team-1', 'project-1')),
			).toEqual(project)
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: projectsKeys.list('team-1'),
			})

			invalidateSpy.mockRestore()
		})
	})

	describe('useUpdateProject', () => {
		it('обновляет кэш проекта и инвалидирует список', async () => {
			const project = createProjectFixture({
				id: 'project-1',
				name: 'Updated Project',
			})

			projectsServiceMock.update.mockResolvedValue(project)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useUpdateProject(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				data: { name: 'Updated Project' },
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(projectsServiceMock.update).toHaveBeenCalledWith('team-1', 'project-1', {
				name: 'Updated Project',
			})
			expect(
				queryClient.getQueryData(projectsKeys.detail('team-1', 'project-1')),
			).toEqual(project)
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: projectsKeys.list('team-1'),
			})

			invalidateSpy.mockRestore()
		})
	})

	describe('useDeleteProject', () => {
		it('инвалидирует список и удаляет detail из кэша', async () => {
			const project = createProjectFixture({ id: 'project-1' })

			queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
					mutations: { retry: false },
				},
			})
			queryClient.setQueryData(projectsKeys.detail('team-1', 'project-1'), project)

			projectsServiceMock.delete.mockResolvedValue(undefined)

			const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

			const DeleteProjectWrapper = ({ children }: React.PropsWithChildren) => (
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			)
			DeleteProjectWrapper.displayName = 'UseDeleteProjectQueryClientWrapper'

			const { result } = renderHook(() => useDeleteProject(), {
				wrapper: DeleteProjectWrapper,
			})

			result.current.mutate({ teamId: 'team-1', projectId: 'project-1' })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(projectsServiceMock.delete).toHaveBeenCalledWith('team-1', 'project-1')
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: projectsKeys.list('team-1'),
			})
			expect(
				queryClient.getQueryData(projectsKeys.detail('team-1', 'project-1')),
			).toBeUndefined()

			invalidateSpy.mockRestore()
		})
	})
})
