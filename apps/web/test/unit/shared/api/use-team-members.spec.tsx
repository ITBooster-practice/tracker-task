import '@/test/mocks/api/team-members-service.mock'

import { createTeamMemberFixture } from '@/test/mocks/api/team-api.fixtures'
import {
	resetTeamMembersServiceMock,
	teamMembersServiceMock,
} from '@/test/mocks/api/team-members-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	teamMembersKeys,
	useChangeMemberRole,
	useRemoveTeamMember,
	useTeamMembers,
} from '@/shared/api/use-team-members'
import { teamsKeys } from '@/shared/api/use-teams'

describe('use-team-members hooks', () => {
	let queryClient: QueryClient

	const createWrapper = () => {
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		})

		const QueryClientWrapper = ({ children }: React.PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		QueryClientWrapper.displayName = 'UseTeamMembersQueryClientWrapper'

		return QueryClientWrapper
	}

	beforeEach(() => {
		resetTeamMembersServiceMock()
	})

	it('useTeamMembers запрашивает участников команды', async () => {
		teamMembersServiceMock.getMembers.mockResolvedValue({
			data: [
				createTeamMemberFixture({
					id: 'member-1',
					userId: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
					role: 'ADMIN',
					joinedAt: '2024-02-01',
				}),
			],
			meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
		})

		const { result } = renderHook(() => useTeamMembers('team-1'), {
			wrapper: createWrapper(),
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamMembersServiceMock.getMembers).toHaveBeenCalledWith('team-1', undefined)
		expect(result.current.data?.data).toHaveLength(1)
	})

	it('useTeamMembers не делает запрос без teamId', () => {
		const { result } = renderHook(() => useTeamMembers(''), {
			wrapper: createWrapper(),
		})

		expect(teamMembersServiceMock.getMembers).not.toHaveBeenCalled()
		expect(result.current.fetchStatus).toBe('idle')
	})

	it('useChangeMemberRole инвалидирует members/detail/list кэш', async () => {
		teamMembersServiceMock.changeRole.mockResolvedValue(
			createTeamMemberFixture({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'MEMBER',
				joinedAt: '2024-02-01',
			}),
		)

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useChangeMemberRole('team-1'), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			userId: 'user-1',
			data: { role: 'MEMBER' },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamMembersServiceMock.changeRole).toHaveBeenCalledWith('team-1', 'user-1', {
			role: 'MEMBER',
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamMembersKeys.lists(),
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamsKeys.detail('team-1'),
		})
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamsKeys.lists(),
		})

		invalidateSpy.mockRestore()
	})

	it('useRemoveTeamMember инвалидирует members/detail/list кэш', async () => {
		teamMembersServiceMock.removeMember.mockResolvedValue({
			message: 'Участник успешно исключён',
			success: true,
		})

		const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

		const { result } = renderHook(() => useRemoveTeamMember('team-1'), {
			wrapper: createWrapper(),
		})

		result.current.mutate('user-1')

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(teamMembersServiceMock.removeMember).toHaveBeenCalledWith('team-1', 'user-1')
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: teamMembersKeys.lists(),
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
