import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	teamMembersService,
	type ChangeRole,
	type DeleteTeamResponse,
	type TeamMember,
} from '@/shared/lib/api/team-members-service'
import type { ApiError } from '@/shared/lib/api/types'

import { teamsKeys } from './use-teams'

export const teamMembersKeys = {
	all: ['teams', 'members'] as const,
	lists: () => [...teamMembersKeys.all, 'list'] as const,
	list: (teamId: string) => [...teamMembersKeys.lists(), teamId] as const,
	changeRole: (teamId: string) =>
		[...teamMembersKeys.all, 'change-role', teamId] as const,
	remove: (teamId: string) => [...teamMembersKeys.all, 'remove', teamId] as const,
} as const

export const useTeamMembers = (teamId: string) => {
	return useQuery({
		queryKey: teamMembersKeys.list(teamId),
		queryFn: () => teamMembersService.getMembers(teamId),
		enabled: Boolean(teamId),
	})
}

export const useChangeMemberRole = (teamId: string) => {
	const queryClient = useQueryClient()

	return useMutation<TeamMember, ApiError, { userId: string; data: ChangeRole }>({
		mutationKey: teamMembersKeys.changeRole(teamId || 'mutation'),
		mutationFn: ({ userId, data }) => teamMembersService.changeRole(teamId, userId, data),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: teamMembersKeys.list(teamId) }),
				queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) }),
				queryClient.invalidateQueries({ queryKey: teamsKeys.lists() }),
			])
		},
	})
}

export const useRemoveTeamMember = (teamId: string) => {
	const queryClient = useQueryClient()

	return useMutation<DeleteTeamResponse, ApiError, string>({
		mutationKey: teamMembersKeys.remove(teamId || 'mutation'),
		mutationFn: (userId) => teamMembersService.removeMember(teamId, userId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: teamMembersKeys.list(teamId) }),
				queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) }),
				queryClient.invalidateQueries({ queryKey: teamsKeys.lists() }),
			])
		},
	})
}
