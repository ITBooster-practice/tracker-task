import { useMutationState } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { BoardView } from '@repo/types'

import {
	taskMutationKeys,
	type CreateTaskContext,
	type CreateTaskVariables,
} from '@/shared/api/use-tasks'

import type { BoardAssignee, PendingBoardTask } from './types'

export function usePendingBoardTasks(
	teamId: string,
	projectId: string,
	view: BoardView,
	assignees: BoardAssignee[],
): PendingBoardTask[] {
	const mutations = useMutationState({
		filters: { mutationKey: taskMutationKeys.create, status: 'pending', exact: true },
		select: (mutation) => ({
			localId: `pending-task:${mutation.mutationId}`,
			variables: mutation.state.variables as CreateTaskVariables | undefined,
			context: mutation.state.context as CreateTaskContext | undefined,
		}),
	})
	return useMemo(
		() =>
			mutations.flatMap(({ localId, variables, context }) => {
				if (
					!variables ||
					variables.teamId !== teamId ||
					variables.projectId !== projectId ||
					view.board.projectId !== projectId
				)
					return []
				if (
					context?.createdTaskId &&
					view.columns.some((column) =>
						column.tasks.some((task) => task.id === context.createdTaskId),
					)
				)
					return []
				const { data } = variables
				const column = view.columns.find(
					(item) =>
						item.boardId === view.board.id &&
						item.projectId === projectId &&
						(data.boardColumnId
							? item.id === data.boardColumnId
							: view.board.isDefault &&
								item.isSystem &&
								item.key === (data.status ?? 'TODO')),
				)
				if (!column) return []
				return [
					{
						localId,
						boardColumnId: column.id,
						key: 'Локальная задача',
						title: data.title,
						type: data.type ?? 'TASK',
						priority: data.priority ?? 'MEDIUM',
						labels: data.labels ?? [],
						dueDate: data.dueDate ?? null,
						assigneeId: data.assigneeId ?? null,
						assignee:
							data.assigneeId === undefined
								? null
								: (assignees.find((assignee) => assignee.id === data.assigneeId) ?? {
										id: data.assigneeId,
										name: 'Неизвестный пользователь',
										initials: '?',
									}),
					},
				]
			}),
		[mutations, teamId, projectId, view, assignees],
	)
}
