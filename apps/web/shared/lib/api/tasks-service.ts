import type {
	BoardTask,
	BoardView,
	CreateTask,
	MoveTaskToColumn,
	PaginatedResponse,
	Task,
	TaskFilterParams,
	UpdateTask,
} from '@repo/types'

import { client } from './client'

const buildTasksEndpoint = (teamId: string, projectId: string) =>
	`/teams/${teamId}/projects/${projectId}/tasks`

const buildTaskEndpoint = (teamId: string, projectId: string, taskId: string) =>
	`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`

const buildBoardEndpoint = (teamId: string, projectId: string) =>
	`${buildTasksEndpoint(teamId, projectId)}/board`

export const tasksService = {
	getBoard: async (
		teamId: string,
		projectId: string,
		boardId: string,
		signal?: AbortSignal,
	): Promise<BoardView> => {
		const response = await client.get<BoardView>(buildBoardEndpoint(teamId, projectId), {
			params: { boardId },
			signal,
		})
		return response.data
	},

	move: async (
		teamId: string,
		projectId: string,
		taskId: string,
		body: MoveTaskToColumn,
	): Promise<BoardTask> => {
		const response = await client.patch<BoardTask>(
			`${buildTaskEndpoint(teamId, projectId, taskId)}/move`,
			body,
		)
		return response.data
	},

	getAll: async (
		teamId: string,
		projectId: string,
		params?: TaskFilterParams,
	): Promise<PaginatedResponse<Task>> => {
		const response = await client.get<PaginatedResponse<Task>>(
			buildTasksEndpoint(teamId, projectId),
			{ params },
		)
		return response.data
	},

	getById: async (teamId: string, projectId: string, taskId: string): Promise<Task> => {
		const response = await client.get<Task>(buildTaskEndpoint(teamId, projectId, taskId))
		return response.data
	},

	create: async (teamId: string, projectId: string, data: CreateTask): Promise<Task> => {
		const response = await client.post<Task>(buildTasksEndpoint(teamId, projectId), data)
		return response.data
	},

	update: async (
		teamId: string,
		projectId: string,
		taskId: string,
		data: UpdateTask,
	): Promise<Task> => {
		const response = await client.patch<Task>(
			buildTaskEndpoint(teamId, projectId, taskId),
			data,
		)
		return response.data
	},

	delete: async (teamId: string, projectId: string, taskId: string): Promise<void> => {
		await client.delete(buildTaskEndpoint(teamId, projectId, taskId))
	},
}
