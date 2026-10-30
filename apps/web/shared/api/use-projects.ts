import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import type {
	CreateProjectBody,
	PaginatedResponse,
	PaginationParams,
	Project,
	UpdateProjectBody,
} from '@repo/types'

import { projectsService } from '@/shared/lib/api/projects-service'
import type { ApiError } from '@/shared/lib/api/types'
import { isApiError } from '@/shared/lib/api/utils'
import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

export const projectsKeys = {
	all: ['projects'] as const,
	lists: () => [...projectsKeys.all, 'list'] as const,
	teamLists: (teamId: string) => [...projectsKeys.lists(), teamId] as const,
	list: (teamId: string, params?: PaginationParams) =>
		[...projectsKeys.teamLists(teamId), params] as const,
	details: () => [...projectsKeys.all, 'detail'] as const,
	detail: (teamId: string, projectId: string) =>
		[...projectsKeys.details(), teamId, projectId] as const,
} as const

export const useProjectsList = (
	teamId: string,
	params?: PaginationParams,
	options?: { accountId?: string; enabled?: boolean },
) => {
	return useQuery<PaginatedResponse<Project>>({
		queryKey:
			options?.accountId === undefined
				? projectsKeys.list(teamId, params)
				: [...projectsKeys.list(teamId, params), { accountId: options.accountId }],
		queryFn: () => projectsService.getAll(teamId, params),
		enabled: Boolean(teamId) && (options?.enabled ?? true),
		placeholderData: options?.accountId === undefined ? keepPreviousData : undefined,
	})
}

export const useProjectDetail = (
	teamId: string,
	projectId: string,
	options?: { accountId?: string; enabled?: boolean },
) => {
	return useQuery({
		queryKey:
			options?.accountId === undefined
				? projectsKeys.detail(teamId, projectId)
				: [...projectsKeys.detail(teamId, projectId), { accountId: options.accountId }],
		queryFn: () => projectsService.getById(teamId, projectId),
		enabled: Boolean(teamId) && Boolean(projectId) && (options?.enabled ?? true),
		retry:
			options?.accountId === undefined
				? undefined
				: (count, error) =>
						!(isApiError(error) && [403, 404].includes(error.statusCode)) && count < 3,
	})
}

export const useCreateProject = () => {
	const queryClient = useQueryClient()

	return useMutation<Project, ApiError, { teamId: string; data: CreateProjectBody }>({
		mutationFn: ({ teamId, data }) => projectsService.create(teamId, data),
		onSuccess: (project) => {
			queryClient.setQueryData(projectsKeys.detail(project.teamId, project.id), project)
			queryClient.invalidateQueries({ queryKey: projectsKeys.teamLists(project.teamId) })
		},
	})
}

export const useUpdateProject = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Project,
		ApiError,
		{ teamId: string; projectId: string; data: UpdateProjectBody }
	>({
		mutationFn: ({ teamId, projectId, data }) =>
			projectsService.update(teamId, projectId, data),
		onSuccess: (project, variables) => {
			queryClient.setQueryData(
				projectsKeys.detail(variables.teamId, variables.projectId),
				project,
			)
			queryClient.invalidateQueries({
				queryKey: projectsKeys.teamLists(variables.teamId),
			})
		},
	})
}

export const useDeleteProject = () => {
	const queryClient = useQueryClient()

	return useMutation<void, ApiError, { teamId: string; projectId: string }>({
		mutationFn: ({ teamId, projectId }) => projectsService.delete(teamId, projectId),
		onSuccess: (_, { teamId, projectId }) => {
			useWorkspaceStore.getState().clearProject(teamId, projectId)
			queryClient.invalidateQueries({ queryKey: projectsKeys.teamLists(teamId) })
			queryClient.removeQueries({ queryKey: projectsKeys.detail(teamId, projectId) })
		},
	})
}
