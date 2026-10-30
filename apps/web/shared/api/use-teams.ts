import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import type { PaginatedResponse, PaginationParams } from '@repo/types'

import {
	teamsService,
	type CreateTeam,
	type DeleteTeamResponse,
	type Team,
	type TeamListItem,
	type UpdateTeam,
} from '@/shared/lib/api/teams-service'
import type { ApiError } from '@/shared/lib/api/types'
import { isApiError } from '@/shared/lib/api/utils'
import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

export const teamsKeys = {
	all: ['teams'] as const,
	lists: () => [...teamsKeys.all, 'list'] as const,
	list: (params?: PaginationParams) => [...teamsKeys.lists(), params] as const,
	details: () => [...teamsKeys.all, 'detail'] as const,
	detail: (id: string) => [...teamsKeys.details(), id] as const,
	create: () => [...teamsKeys.all, 'create'] as const,
	update: (id: string) => [...teamsKeys.all, 'update', id] as const,
	delete: (id: string) => [...teamsKeys.all, 'delete', id] as const,
} as const

export const useTeamsList = (
	params?: PaginationParams,
	options?: { accountId?: string; enabled?: boolean },
) => {
	return useQuery({
		queryKey:
			options?.accountId === undefined
				? teamsKeys.list(params)
				: [...teamsKeys.list(params), { accountId: options.accountId }],
		queryFn: () => teamsService.getAll(params),
		placeholderData: options?.accountId === undefined ? keepPreviousData : undefined,
		enabled: options?.enabled,
	})
}

export const useTeamDetail = (
	id: string,
	options?: { enabled?: boolean; accountId?: string },
) => {
	return useQuery({
		queryKey:
			options?.accountId === undefined
				? teamsKeys.detail(id)
				: [...teamsKeys.detail(id), { accountId: options.accountId }],
		queryFn: () => teamsService.getById(id),
		enabled: Boolean(id) && (options?.enabled ?? true),
		retry:
			options?.accountId === undefined
				? undefined
				: (count, error) =>
						!(isApiError(error) && [403, 404].includes(error.statusCode)) && count < 3,
	})
}

export const useTeamName = (teamId: string): string | undefined => {
	const queryClient = useQueryClient()

	const allListData = queryClient.getQueriesData<PaginatedResponse<TeamListItem>>({
		queryKey: teamsKeys.lists(),
	})
	const nameFromCache = allListData
		.flatMap(([, data]) => data?.data ?? [])
		.find((t) => t.id === teamId)?.name

	const { data: teamDetail } = useTeamDetail(teamId, {
		enabled: !nameFromCache && Boolean(teamId),
	})

	return nameFromCache ?? teamDetail?.name
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
			useWorkspaceStore.getState().clearTeam(id)
			queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
			queryClient.removeQueries({ queryKey: teamsKeys.detail(id) })
		},
	})
}
