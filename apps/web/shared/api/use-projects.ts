import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import type { CreateProjectBody, Project, UpdateProjectBody } from '@repo/types'

import { projectsService } from '@/shared/lib/api/projects-service'
import type { ApiError } from '@/shared/lib/api/types'

export const projectsKeys = {
	all: ['projects'] as const,
	lists: () => [...projectsKeys.all, 'list'] as const,
	list: (teamId: string) => [...projectsKeys.lists(), teamId] as const,
	details: () => [...projectsKeys.all, 'detail'] as const,
	detail: (teamId: string, projectId: string) =>
		[...projectsKeys.details(), teamId, projectId] as const,
} as const

export const useProjectsList = (teamId: string) => {
	return useQuery({
		queryKey: projectsKeys.list(teamId),
		queryFn: () => projectsService.getAll(teamId),
		enabled: Boolean(teamId),
		placeholderData: keepPreviousData,
	})
}

export const useProjectDetail = (teamId: string, projectId: string) => {
	return useQuery({
		queryKey: projectsKeys.detail(teamId, projectId),
		queryFn: () => projectsService.getById(teamId, projectId),
		enabled: Boolean(teamId) && Boolean(projectId),
	})
}

export const useCreateProject = () => {
	const queryClient = useQueryClient()

	return useMutation<Project, ApiError, { teamId: string; data: CreateProjectBody }>({
		mutationFn: ({ teamId, data }) => projectsService.create(teamId, data),
		onSuccess: (project) => {
			queryClient.setQueryData(projectsKeys.detail(project.teamId, project.id), project)
			queryClient.invalidateQueries({ queryKey: projectsKeys.list(project.teamId) })
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
			queryClient.invalidateQueries({ queryKey: projectsKeys.list(variables.teamId) })
		},
	})
}

export const useDeleteProject = () => {
	const queryClient = useQueryClient()

	return useMutation<void, ApiError, { teamId: string; projectId: string }>({
		mutationFn: ({ teamId, projectId }) => projectsService.delete(teamId, projectId),
		onSuccess: (_, { teamId, projectId }) => {
			queryClient.invalidateQueries({ queryKey: projectsKeys.list(teamId) })
			queryClient.removeQueries({ queryKey: projectsKeys.detail(teamId, projectId) })
		},
	})
}
