import type { Task } from '@repo/types'

export function createTaskFixture(overrides?: Partial<Task>): Task {
	return {
		id: 'task-1',
		title: 'Test Task',
		description: null,
		type: 'TASK',
		status: 'TODO',
		priority: 'MEDIUM',
		position: 1,
		projectId: 'project-1',
		assigneeId: null,
		dueDate: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	}
}
