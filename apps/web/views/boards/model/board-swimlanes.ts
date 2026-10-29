import type { Priority } from '@repo/types'

import { BOARD_PRIORITY_LABELS } from './constants'
import { fullBoardMovePosition } from './project-board-filters'
import type { BoardAssignee, BoardColumn, BoardTask, BoardTaskMoveInput } from './types'
import { findBoardTask, moveTaskInColumns } from './utils'

export type BoardGrouping = 'none' | 'priority' | 'assignee'
export interface BoardLane {
	key: string
	label: string
	priority?: Priority
	assigneeId?: string | null
	assignee?: BoardAssignee
	assignable: boolean
}
export const parseBoardGrouping = (params: URLSearchParams): BoardGrouping => {
	const value = params.get('groupBy')
	return value === 'priority' || value === 'assignee' ? value : 'none'
}
const laneKey = (kind: BoardGrouping, value: string | null) =>
	JSON.stringify([kind, value])

export function buildBoardLanes(
	mode: BoardGrouping,
	columns: BoardColumn[],
	assignees: BoardAssignee[],
): BoardLane[] {
	if (mode === 'none') return []
	if (mode === 'priority')
		return (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => ({
			key: laneKey(mode, priority),
			label: BOARD_PRIORITY_LABELS[priority],
			priority,
			assignable: true,
		}))
	const known = new Map(assignees.map((assignee) => [assignee.id, assignee]))
	const lanes: BoardLane[] = [
		{
			key: laneKey(mode, null),
			label: 'Без исполнителя',
			assigneeId: null,
			assignable: true,
		},
	]
	for (const assignee of [...known.values()].sort((a, b) =>
		a.name.localeCompare(b.name, 'ru'),
	))
		lanes.push({
			key: laneKey(mode, assignee.id),
			label: assignee.name,
			assigneeId: assignee.id,
			assignee,
			assignable: true,
		})
	const unknown = new Set(
		columns
			.flatMap((column) => column.tasks.map((task) => task.assigneeId))
			.filter((id): id is string => id !== null && !known.has(id)),
	)
	for (const id of [...unknown].sort())
		lanes.push({
			key: laneKey(mode, id),
			label: `Неизвестный участник (${id.slice(0, 8)})`,
			assigneeId: id,
			assignable: false,
		})
	return lanes
}

export const taskInLane = (
	task: BoardTask,
	lane: Pick<BoardLane, 'priority' | 'assigneeId'>,
) =>
	(lane.priority === undefined || task.priority === lane.priority) &&
	(lane.assigneeId === undefined || task.assigneeId === lane.assigneeId)
export const laneColumns = (
	columns: BoardColumn[],
	lane: Pick<BoardLane, 'priority' | 'assigneeId'>,
) =>
	columns.map((column) => ({
		...column,
		tasks: column.tasks.filter((task) => taskInLane(task, lane)),
	}))
export const laneMoveFields = (lane: BoardLane) =>
	lane.priority !== undefined
		? { priority: lane.priority }
		: { assigneeId: lane.assigneeId }
export const canDropInLane = (task: BoardTask | null, lane: BoardLane) =>
	lane.assignable || !task || taskInLane(task, lane)

export const boardCellId = (lane: BoardLane, columnId: string) =>
	`board-cell:${JSON.stringify([lane.key, columnId])}`
export function parseBoardCellId(
	id: string,
): { laneKey: string; columnId: string } | null {
	if (!id.startsWith('board-cell:')) return null
	try {
		const value: unknown = JSON.parse(id.slice('board-cell:'.length))
		return Array.isArray(value) &&
			value.length === 2 &&
			value.every((item) => typeof item === 'string')
			? { laneKey: value[0]!, columnId: value[1]! }
			: null
	} catch {
		return null
	}
}

export function moveTaskInLane(
	columns: BoardColumn[],
	input: BoardTaskMoveInput,
	lane: BoardLane,
) {
	const position = fullBoardMovePosition(
		columns,
		laneColumns(columns, lane),
		input.taskId,
		input.toColumnId,
		input.toIndex,
	)
	if (position === null || position < 0) return columns
	const next = moveTaskInColumns(columns, {
		...input,
		toIndex: position,
		...laneMoveFields(lane),
	})
	if (next === columns) return columns
	return next.map((column) => ({
		...column,
		tasks: column.tasks.map((task) =>
			task.id === input.taskId && lane.assigneeId !== undefined
				? {
						...task,
						assignee: lane.assigneeId === null ? null : (lane.assignee ?? task.assignee),
					}
				: task,
		),
	}))
}

export function keyboardLanePlacement(
	columns: BoardColumn[],
	lanes: BoardLane[],
	current: BoardTaskMoveInput,
	originalTask: BoardTask,
	code: string,
): BoardTaskMoveInput | null {
	const active = findBoardTask(columns, current.taskId)
	const laneIndex = lanes.findIndex((lane) => active && taskInLane(active, lane))
	const columnIndex = columns.findIndex((column) => column.id === current.toColumnId)
	if (laneIndex < 0 || columnIndex < 0) return null
	let targetLaneIndex = laneIndex,
		targetColumnIndex = columnIndex
	const tasks = columns[columnIndex]!.tasks.filter(
		(task) => task.id !== current.taskId && taskInLane(task, lanes[laneIndex]!),
	)
	let toIndex = Math.min(current.toIndex, tasks.length)
	if (code === 'ArrowLeft') targetColumnIndex--
	else if (code === 'ArrowRight') targetColumnIndex++
	else if (code === 'ArrowUp') {
		if (toIndex > 0) toIndex--
		else {
			targetLaneIndex--
			toIndex = Number.MAX_SAFE_INTEGER
		}
	} else if (code === 'ArrowDown') {
		if (toIndex < tasks.length) toIndex++
		else {
			targetLaneIndex++
			toIndex = 0
		}
	} else return null
	const lane = lanes[targetLaneIndex],
		column = columns[targetColumnIndex]
	if (!lane || !column || !canDropInLane(originalTask, lane)) return null
	const count = column.tasks.filter(
		(task) => task.id !== current.taskId && taskInLane(task, lane),
	).length
	return {
		taskId: current.taskId,
		toColumnId: column.id,
		toIndex: Math.min(toIndex, count),
		...laneMoveFields(lane),
	}
}
