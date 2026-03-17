import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	teamsService,
	type CreateTeam,
	type DeleteTeamResponse,
	type Team,
	type UpdateTeam,
} from '@/shared/lib/api/teams-service'
import type { ApiError } from '@/shared/lib/api/types'

export const teamsKeys = {
	all: ['teams'] as const,
	lists: () => [...teamsKeys.all, 'list'] as const,
	list: () => [...teamsKeys.lists()] as const,
	details: () => [...teamsKeys.all, 'detail'] as const,
	detail: (id: string) => [...teamsKeys.details(), id] as const,
	create: () => [...teamsKeys.all, 'create'] as const,
	update: (id: string) => [...teamsKeys.all, 'update', id] as const,
	delete: (id: string) => [...teamsKeys.all, 'delete', id] as const,
} as const

export const useTeamsList = () => {
	return useQuery({
		queryKey: teamsKeys.list(),
		queryFn: teamsService.getAll,
	})
}

export const useTeamDetail = (id: string) => {
	return useQuery({
		queryKey: teamsKeys.detail(id),
		queryFn: () => teamsService.getById(id),
		enabled: Boolean(id),
	})
}

export const useCreateTeam = () => {
	const queryClient = useQueryClient()

	return useMutation<Team, ApiError, CreateTeam>({
		mutationKey: teamsKeys.create(),
		mutationFn: teamsService.create,
		onSuccess: (team) => {
			queryClient.setQueryData(teamsKeys.detail(team.id), team)
			queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
		},
	})
}

export const useUpdateTeam = () => {
	const queryClient = useQueryClient()

	return useMutation<Team, ApiError, { id: string; data: UpdateTeam }>({
		mutationKey: teamsKeys.update('mutation'),
		mutationFn: ({ id, data }) => teamsService.update(id, data),
		onSuccess: (team, variables) => {
			queryClient.setQueryData(teamsKeys.detail(team.id), team)
			queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
			queryClient.invalidateQueries({ queryKey: teamsKeys.detail(variables.id) })
		},
	})
}

export const useDeleteTeam = () => {
	const queryClient = useQueryClient()

	return useMutation<DeleteTeamResponse, ApiError, string>({
		mutationKey: teamsKeys.delete('mutation'),
		mutationFn: teamsService.delete,
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
			queryClient.removeQueries({ queryKey: teamsKeys.detail(id) })
		},
	})
}
