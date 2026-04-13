import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	teamMembersKeys,
	useChangeMemberRole,
	useTeamMembers,
} from '@/shared/api/use-team-members'
import { teamsKeys } from '@/shared/api/use-teams'
import {
	teamMembersService,
	type TeamMember,
} from '@/shared/lib/api/team-members-service'

vi.mock('@/shared/lib/api/team-members-service', () => ({
	teamMembersService: {
		getMembers: vi.fn(),
		changeRole: vi.fn(),
		removeMember: vi.fn(),
	},
}))

describe('use-team-members hooks', () => {
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

	it('useTeamMembers запрашивает участников команды', async () => {
		vi.mocked(teamMembersService.getMembers).mockResolvedValue([
			{
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '2024-02-01',
			},
		] as TeamMember[])

		const { result } = renderHook(() => useTeamMembers('team-1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamMembersService.getMembers).toHaveBeenCalledWith('team-1')
		expect(result.current.data).toHaveLength(1)
	})

	it('useChangeMemberRole инвалидирует members/detail/list кэш', async () => {
		vi.mocked(teamMembersService.changeRole).mockResolvedValue({
			id: 'member-1',
			userId: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
			role: 'MEMBER',
			joinedAt: '2024-02-01',
		} as TeamMember)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useChangeMemberRole('team-1'), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			userId: 'user-1',
			data: { role: 'MEMBER' },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamMembersService.changeRole).toHaveBeenCalledWith('team-1', 'user-1', {
			role: 'MEMBER',
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamMembersKeys.list('team-1'),
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamsKeys.detail('team-1'),
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamsKeys.lists(),
		})

		invalidateSpy.mockRestore()
	})
})
