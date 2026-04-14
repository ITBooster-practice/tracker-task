import '@/test/mocks/api/teams-service.mock'

import {
	createDeleteTeamResponseFixture,
	createTeamFixture,
	createTeamListItemFixture,
} from '@/test/mocks/api/team-api.fixtures'
import {
	resetTeamsServiceMock,
	teamsServiceMock,
} from '@/test/mocks/api/teams-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	teamsKeys,
	useCreateTeam,
	useDeleteTeam,
	useTeamDetail,
	useTeamsList,
	useUpdateTeam,
} from '@/shared/api/use-teams'

describe('use-teams hooks', () => {
	let queryClient: QueryClient

	const createWrapper = () => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		return ({ children }: React.PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
	}

	beforeEach(() => {
		resetTeamsServiceMock()
	})

	describe('useTeamsList', () => {
		it('запрашивает список команд', async () => {
			const teams = [
				createTeamListItemFixture({
					id: 'team-1',
					name: 'Team A',
				}),
			]

			teamsServiceMock.getAll.mockResolvedValue(teams)

			const { result } = renderHook(() => useTeamsList(), { wrapper: createWrapper() })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsServiceMock.getAll).toHaveBeenCalledOnce()
			expect(result.current.data).toEqual(teams)
		})
	})

	describe('useTeamDetail', () => {
		it('запрашивает команду по id, если он передан', async () => {
			const team = createTeamFixture({
				id: 'team-1',
				name: 'Alpha Team',
			})

			teamsServiceMock.getById.mockResolvedValue(team)

			const { result } = renderHook(() => useTeamDetail('team-1'), {
				wrapper: createWrapper(),
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsServiceMock.getById).toHaveBeenCalledWith('team-1')
			expect(result.current.data).toEqual(team)
		})

		it('не делает запрос, если id пустой', async () => {
			const { result } = renderHook(() => useTeamDetail(''), {
				wrapper: createWrapper(),
			})

			expect(teamsServiceMock.getById).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})
	})

	describe('useCreateTeam', () => {
		it('после создания команды обновляет кэш (setQueryData) и инвалидирует список', async () => {
			const team = createTeamFixture({
				id: 'team-1',
				name: 'New Team',
			})
			teamsServiceMock.create.mockResolvedValue(team)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useCreateTeam(), { wrapper: createWrapper() })

			result.current.mutate({ name: 'New Team' })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsServiceMock.create).toHaveBeenCalledWith(
				{ name: 'New Team' },
				expect.anything(),
			)
			expect(queryClient.getQueryData(teamsKeys.detail('team-1'))).toEqual(team)
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() })

			invalidateSpy.mockRestore()
		})
	})

	describe('useUpdateTeam', () => {
		it('обновляет кэш команды и инвалидирует список и detail', async () => {
			const team = createTeamFixture({
				id: 'team-1',
				name: 'Updated Team',
				description: 'Refined description',
			})

			teamsServiceMock.update.mockResolvedValue(team)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useUpdateTeam(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({
				id: 'team-1',
				data: {
					name: 'Updated Team',
					description: 'Refined description',
				},
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsServiceMock.update).toHaveBeenCalledWith('team-1', {
				name: 'Updated Team',
				description: 'Refined description',
			})
			expect(queryClient.getQueryData(teamsKeys.detail('team-1'))).toEqual(team)
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() })
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: teamsKeys.detail('team-1'),
			})

			invalidateSpy.mockRestore()
		})
	})

	describe('useDeleteTeam', () => {
		it('инвалидирует список и удаляет detail из кэша', async () => {
			const team = createTeamFixture({
				id: 'team-1',
				name: 'Alpha Team',
			})

			queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
					mutations: { retry: false },
				},
			})
			queryClient.setQueryData(teamsKeys.detail(team.id), team)

			teamsServiceMock.delete.mockResolvedValue(createDeleteTeamResponseFixture())

			const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

			const wrapper = ({ children }: React.PropsWithChildren) => (
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			)

			const { result } = renderHook(() => useDeleteTeam(), { wrapper })

			result.current.mutate('team-1')

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsServiceMock.delete).toHaveBeenCalledWith('team-1', expect.anything())
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() })
			expect(queryClient.getQueryData(teamsKeys.detail('team-1'))).toBeUndefined()

			invalidateSpy.mockRestore()
		})
	})
})
