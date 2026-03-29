import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { teamsKeys, useCreateTeam, useTeamsList } from '@/shared/api/use-teams'
import { Team, TeamListItem, teamsService } from '@/shared/lib/api/teams-service'

vi.mock('@/shared/lib/api/teams-service', () => ({
	teamsService: {
		getAll: vi.fn(),
		getById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}))

describe('use-teams hooks', () => {
	let queryClient: QueryClient

	const createWrapper = () => {
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		})
		return ({ children }: React.PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('useTeamsList', () => {
		it('запрашивает список команд', async () => {
			const mockTeams = [{ id: '1', name: 'Team A' }]
			vi.mocked(teamsService.getAll).mockResolvedValue(mockTeams as TeamListItem[])

			const { result } = renderHook(() => useTeamsList(), { wrapper: createWrapper() })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsService.getAll).toHaveBeenCalledOnce()
			expect(result.current.data).toEqual(mockTeams)
		})
	})

	describe('useCreateTeam', () => {
		it('после создания команды обновляет кэш (setQueryData) и инвалидирует список', async () => {
			const newTeam = { id: 'team-1', name: 'New Team' }
			vi.mocked(teamsService.create).mockResolvedValue(newTeam as Team)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useCreateTeam(), { wrapper: createWrapper() })

			result.current.mutate({ name: 'New Team' })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(teamsService.create).toHaveBeenCalledWith(
				{ name: 'New Team' },
				expect.anything(),
			)

			const cachedTeam = queryClient.getQueryData(teamsKeys.detail('team-1'))
			expect(cachedTeam).toEqual(newTeam)

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() })

			invalidateSpy.mockRestore()
		})
	})
})
