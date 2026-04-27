import type { CreateProjectBody, Project, UpdateProjectBody } from '@repo/types'

import { client } from './client'

const buildProjectsEndpoint = (teamId: string) => `/teams/${teamId}/projects`
const buildProjectEndpoint = (teamId: string, projectId: string) =>
	`/teams/${teamId}/projects/${projectId}`

export const projectsService = {
	getAll: async (teamId: string): Promise<Project[]> => {
		const response = await client.get<Project[]>(buildProjectsEndpoint(teamId))
		return response.data
	},

	getById: async (teamId: string, projectId: string): Promise<Project> => {
		const response = await client.get<Project>(buildProjectEndpoint(teamId, projectId))
		return response.data
	},

	create: async (teamId: string, body: CreateProjectBody): Promise<Project> => {
		const response = await client.post<Project>(buildProjectsEndpoint(teamId), body)
		return response.data
	},

	update: async (
		teamId: string,
		projectId: string,
		body: UpdateProjectBody,
	): Promise<Project> => {
		const response = await client.patch<Project>(
			buildProjectEndpoint(teamId, projectId),
			body,
		)
		return response.data
	},

	delete: async (teamId: string, projectId: string): Promise<void> => {
		await client.delete(buildProjectEndpoint(teamId, projectId))
	},
}
