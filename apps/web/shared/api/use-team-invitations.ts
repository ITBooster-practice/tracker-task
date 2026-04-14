import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	teamInvitationsService,
	type SendInvitation,
	type Team,
	type TeamInvitation,
} from '@/shared/lib/api/team-invitations-service'
import type { ApiError } from '@/shared/lib/api/types'

import { teamsKeys } from './use-teams'

export const teamInvitationsKeys = {
	all: ['teams', 'invitations'] as const,
	teamLists: () => [...teamInvitationsKeys.all, 'team-list'] as const,
	teamList: (teamId: string) => [...teamInvitationsKeys.teamLists(), teamId] as const,
	send: (teamId: string) => [...teamInvitationsKeys.all, 'send', teamId] as const,
	revoke: (teamId: string) => [...teamInvitationsKeys.all, 'revoke', teamId] as const,
	myLists: () => [...teamInvitationsKeys.all, 'my-list'] as const,
	myList: () => [...teamInvitationsKeys.myLists()] as const,
	accept: () => [...teamInvitationsKeys.all, 'accept'] as const,
	decline: () => [...teamInvitationsKeys.all, 'decline'] as const,
} as const

type TeamInvitationsQueryOptions = {
	enabled?: boolean
}

export const useTeamInvitations = (
	teamId: string,
	options?: TeamInvitationsQueryOptions,
) => {
	return useQuery({
		queryKey: teamInvitationsKeys.teamList(teamId),
		queryFn: () => teamInvitationsService.getTeamInvitations(teamId),
		enabled: Boolean(teamId) && (options?.enabled ?? true),
	})
}

export const useSendTeamInvitation = (teamId: string) => {
	const queryClient = useQueryClient()

	return useMutation<TeamInvitation, ApiError, SendInvitation>({
		mutationKey: teamInvitationsKeys.send(teamId || 'mutation'),
		mutationFn: (data) => teamInvitationsService.sendInvitation(teamId, data),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: teamInvitationsKeys.teamList(teamId),
			}),
	})
}

export const useRevokeTeamInvitation = (teamId: string) => {
	const queryClient = useQueryClient()

	return useMutation<TeamInvitation, ApiError, string>({
		mutationKey: teamInvitationsKeys.revoke(teamId || 'mutation'),
		mutationFn: (invitationId) =>
			teamInvitationsService.revokeInvitation(teamId, invitationId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: teamInvitationsKeys.teamList(teamId),
			}),
	})
}

export const useMyInvitations = (options?: TeamInvitationsQueryOptions) => {
	return useQuery({
		queryKey: teamInvitationsKeys.myList(),
		queryFn: teamInvitationsService.getMyInvitations,
		enabled: options?.enabled ?? true,
	})
}

export const useAcceptInvitation = () => {
	const queryClient = useQueryClient()

	return useMutation<Team, ApiError, string>({
		mutationKey: teamInvitationsKeys.accept(),
		mutationFn: teamInvitationsService.acceptInvitation,
		onSuccess: async (team) => {
			queryClient.setQueryData(teamsKeys.detail(team.id), team)

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: teamsKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: teamInvitationsKeys.myList() }),
			])
		},
	})
}

export const useDeclineInvitation = () => {
	const queryClient = useQueryClient()

	return useMutation<TeamInvitation, ApiError, string>({
		mutationKey: teamInvitationsKeys.decline(),
		mutationFn: teamInvitationsService.declineInvitation,
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: teamInvitationsKeys.myList(),
			}),
	})
}
