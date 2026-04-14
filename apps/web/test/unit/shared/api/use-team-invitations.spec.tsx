import '@/test/mocks/api/team-invitations-service.mock'

import {
	createMyInvitationFixture,
	createTeamFixture,
	createTeamInvitationFixture,
} from '@/test/mocks/api/team-api.fixtures'
import {
	resetTeamInvitationsServiceMock,
	teamInvitationsServiceMock,
} from '@/test/mocks/api/team-invitations-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	teamInvitationsKeys,
	useAcceptInvitation,
	useDeclineInvitation,
	useMyInvitations,
	useRevokeTeamInvitation,
	useSendTeamInvitation,
	useTeamInvitations,
} from '@/shared/api/use-team-invitations'
import { teamsKeys } from '@/shared/api/use-teams'

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
		resetTeamInvitationsServiceMock()
	})

	it('useTeamInvitations запрашивает invitations команды', async () => {
		teamInvitationsServiceMock.getTeamInvitations.mockResolvedValue([
			createTeamInvitationFixture({
				role: 'ADMIN',
			}),
		])

		const { result } = renderHook(() => useTeamInvitations('team-1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.getTeamInvitations).toHaveBeenCalledWith('team-1')
		expect(result.current.data).toHaveLength(1)
	})

	it('useMyInvitations запрашивает входящие invitations', async () => {
		teamInvitationsServiceMock.getMyInvitations.mockResolvedValue([
			createMyInvitationFixture(),
		])

		const { result } = renderHook(() => useMyInvitations(), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.getMyInvitations).toHaveBeenCalledOnce()
		expect(result.current.data).toHaveLength(1)
	})

	it('useSendTeamInvitation инвалидирует список приглашений команды', async () => {
		teamInvitationsServiceMock.sendInvitation.mockResolvedValue(
			createTeamInvitationFixture(),
		)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useSendTeamInvitation('team-1'), {
			wrapper: createWrapper(),
		})

		result.current.mutate({ email: 'new@test.com', role: 'MEMBER' })

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.sendInvitation).toHaveBeenCalledWith('team-1', {
			email: 'new@test.com',
			role: 'MEMBER',
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamInvitationsKeys.teamList('team-1'),
		})

		invalidateSpy.mockRestore()
	})

	it('useAcceptInvitation кладёт команду в detail cache и инвалидирует списки', async () => {
		teamInvitationsServiceMock.acceptInvitation.mockResolvedValue(
			createTeamFixture({
				id: 'team-1',
				name: 'Dream Team',
				updatedAt: '2024-01-02',
				members: [],
			}),
		)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useAcceptInvitation(), {
			wrapper: createWrapper(),
		})

		result.current.mutate('token-1')

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.acceptInvitation).toHaveBeenCalledWith(
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

	it('useRevokeTeamInvitation инвалидирует список приглашений команды', async () => {
		teamInvitationsServiceMock.revokeInvitation.mockResolvedValue(
			createTeamInvitationFixture({
				status: 'DECLINED',
				updatedAt: '2026-04-09T12:05:00.000Z',
			}),
		)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useRevokeTeamInvitation('team-1'), {
			wrapper: createWrapper(),
		})

		result.current.mutate('inv-1')

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.revokeInvitation).toHaveBeenCalledWith(
			'team-1',
			'inv-1',
		)
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamInvitationsKeys.teamList('team-1'),
		})

		invalidateSpy.mockRestore()
	})

	it('useDeclineInvitation инвалидирует список моих приглашений', async () => {
		teamInvitationsServiceMock.declineInvitation.mockResolvedValue(
			createTeamInvitationFixture({
				status: 'DECLINED',
				updatedAt: '2026-04-09T12:05:00.000Z',
			}),
		)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useDeclineInvitation(), {
			wrapper: createWrapper(),
		})

		result.current.mutate('token-1')

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamInvitationsServiceMock.declineInvitation).toHaveBeenCalledWith(
			'token-1',
			expect.anything(),
		)
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamInvitationsKeys.myList(),
		})

		invalidateSpy.mockRestore()
	})
})
