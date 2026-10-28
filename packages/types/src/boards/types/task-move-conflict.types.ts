export const TASK_MOVE_CONFLICT_REASONS = [
	'SOURCE_CHANGED',
	'VERSION_MISMATCH',
	'WRITE_CONFLICT',
] as const

export type TaskMoveConflictReason = (typeof TASK_MOVE_CONFLICT_REASONS)[number]

export interface TaskMoveConflict {
	statusCode: 409
	code: 'TASK_MOVE_CONFLICT'
	taskId: string
	reason: TaskMoveConflictReason
	message: string
}
