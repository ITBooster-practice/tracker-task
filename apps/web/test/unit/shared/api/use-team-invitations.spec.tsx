import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	teamInvitationsKeys,
	useAcceptInvitation,
	useMyInvitations,
	useTeamInvitations,
} from '@/shared/api/use-team-invitations'
import { teamsKeys } from '@/shared/api/use-teams'
import {
	teamInvitationsService,
	type MyInvitation,
	type Team,
	type TeamInvitation,
} from '@/shared/lib/api/team-invitations-service'

vi.mock('@/shared/lib/api/team-invitations-service', () => ({
	teamInvitationsService: {
		sendInvitation: vi.fn(),
		getTeamInvitations: vi.fn(),
		revokeInvitation: vi.fn(),
		getMyInvitations: vi.fn(),
		acceptInvitation: vi.fn(),
		declineInvitation: vi.fn(),
	},
}))

describe('use-team-invitations hooks', () => {
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

	it('useTeamInvitations запрашивает invitations команды', async () => {
		vi.mocked(teamInvitationsService.getTeamInvitations).mockResolvedValue([
			{
				id: 'inv-1',
				teamId: 'team-1',
				invitedById: 'user-1',
				email: 'new@test.com',
				role: 'ADMIN',
				status: 'PENDING',
				token: 'token-1',
				expiresAt: '2026-04-11T12:00:00.000Z',
				createdAt: '2026-04-09T12:00:00.000Z',
				updatedAt: '2026-04-09T12:00:00.000Z',
				team: { id: 'team-1', name: 'Dream Team', avatarUrl: null },
				invitedBy: { id: 'user-1', name: 'Alex', email: 'alex@test.com' },
			},
		] as TeamInvitation[])

		const { result } = renderHook(() => useTeamInvitations('team-1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsService.getTeamInvitations).toHaveBeenCalledWith('team-1')
		expect(result.current.data).toHaveLength(1)
	})

	it('useMyInvitations запрашивает входящие invitations', async () => {
		vi.mocked(teamInvitationsService.getMyInvitations).mockResolvedValue([
			{
				id: 'inv-1',
				email: 'new@test.com',
				role: 'MEMBER',
				token: 'token-1',
				expiresAt: '2026-04-11T12:00:00.000Z',
				createdAt: '2026-04-09T12:00:00.000Z',
				team: { id: 'team-1', name: 'Dream Team', avatarUrl: null },
				invitedBy: { id: 'user-1', name: 'Alex', email: 'alex@test.com' },
			},
		] as MyInvitation[])

		const { result } = renderHook(() => useMyInvitations(), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsService.getMyInvitations).toHaveBeenCalledOnce()
		expect(result.current.data).toHaveLength(1)
	})

	it('useAcceptInvitation кладёт команду в detail cache и инвалидирует списки', async () => {
		vi.mocked(teamInvitationsService.acceptInvitation).mockResolvedValue({
			id: 'team-1',
			name: 'Dream Team',
			description: null,
			avatarUrl: null,
			createdAt: '2024-01-01',
			updatedAt: '2024-01-02',
			members: [],
		} as Team)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useAcceptInvitation(), {
			wrapper: createWrapper(),
		})

		result.current.mutate('token-1')

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsService.acceptInvitation).toHaveBeenCalledWith(
			'token-1',
			expect.anything(),
		)
		expect(queryClient.getQueryData(teamsKeys.detail('team-1'))).toEqual({
			id: 'team-1',
			name: 'Dream Team',
			description: null,
			avatarUrl: null,
			createdAt: '2024-01-01',
			updatedAt: '2024-01-02',
			members: [],
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamsKeys.lists(),
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamInvitationsKeys.myList(),
		})

		invalidateSpy.mockRestore()
	})
})
