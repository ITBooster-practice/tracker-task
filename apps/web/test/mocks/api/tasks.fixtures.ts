import type { Task } from '@repo/types'

export function createTaskFixture(overrides?: Partial<Task>): Task {
	return {
		id: 'task-1',
		title: 'Test Task',
		description: null,
		labels: [],
		type: 'TASK',
		status: 'TODO',
		priority: 'MEDIUM',
		position: 1,
		version: 0,
		projectId: 'project-1',
		boardColumnId: 'board-1-column',
		assigneeId: null,
		createdById: 'user-1',
		dueDate: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	}
}
