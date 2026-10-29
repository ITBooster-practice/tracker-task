import { createBoardViewFixture } from '@/test/mocks/api/boards.fixtures'
import {
	createBoardColumnsFixture,
	createBoardTaskFixture,
} from '@/test/mocks/views/boards/board-ui.fixtures'
import { expect, it } from 'vitest'

import {
	boardCellId,
	buildBoardLanes,
	canDropInLane,
	keyboardLanePlacement,
	laneColumns,
	moveTaskInLane,
	parseBoardCellId,
	parseBoardGrouping,
	taskInLane,
} from '@/views/boards/model/board-swimlanes'
import { optimisticBoardMove } from '@/shared/lib/optimistic-board-move'

it.each([
	['priority', 'priority'],
	['assignee', 'assignee'],
	['other', 'none'],
	['', 'none'],
] as const)('читает режим группировки %s', (value, expected) => {
	expect(parseBoardGrouping(new URLSearchParams({ groupBy: value }))).toBe(expected)
})
it('строит все приоритеты, включая пустые цели, без изменения исходных данных', () => {
	const columns = createBoardColumnsFixture(),
		before = structuredClone(columns)
	expect(buildBoardLanes('none', columns, [])).toEqual([])
	const lanes = buildBoardLanes('priority', columns, [])
	expect(lanes.map((lane) => lane.priority)).toEqual([
		'CRITICAL',
		'HIGH',
		'MEDIUM',
		'LOW',
	])
	expect(laneColumns(columns, lanes[0]!)[0]!.tasks).toEqual([])
	expect(columns).toEqual(before)
})
it('различает пустые и неизвестные назначения и не назначает новому неизвестному участнику', () => {
	const columns = createBoardColumnsFixture()
	columns[1]!.tasks = []
	columns[0]!.tasks = [
		createBoardTaskFixture({ assigneeId: 'missing-a' }),
		createBoardTaskFixture({ id: 'b', assigneeId: 'missing-b' }),
		createBoardTaskFixture({ id: 'c', assigneeId: null }),
	]
	const lanes = buildBoardLanes('assignee', columns, [
		{ id: 'anna', name: 'Анна', initials: 'А' },
	])
	expect(lanes.map((lane) => lane.assigneeId)).toEqual([
		null,
		'anna',
		'missing-a',
		'missing-b',
	])
	expect(lanes[2]!.assignable).toBe(false)
	expect(canDropInLane(columns[0]!.tasks[0]!, lanes[2]!)).toBe(true)
	expect(canDropInLane(columns[0]!.tasks[1]!, lanes[2]!)).toBe(false)
	expect(laneColumns(columns, lanes[0]!)[0]!.tasks.map((task) => task.id)).toEqual(['c'])
})
it('кодирует ячейку без коллизий для двоеточий и произвольных ID', () => {
	const columns = createBoardColumnsFixture()
	const lane = buildBoardLanes('assignee', columns, [
		{ id: 'user: /%', name: 'Тест', initials: 'Т' },
	])[1]!
	const id = boardCellId(lane, 'column: /%')
	expect(parseBoardCellId(id)).toEqual({ laneKey: lane.key, columnId: 'column: /%' })
	expect(boardCellId({ ...lane, key: 'another' }, 'column: /%')).not.toBe(id)
	for (const invalid of [
		'task-a',
		'board-cell:bad',
		'board-cell:[null,1]',
		'board-cell:["a"]',
	])
		expect(parseBoardCellId(invalid)).toBeNull()
})
it('меняет только группу при той же колонке и позиции', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = [createBoardTaskFixture({ priority: 'HIGH' })]
	const lane = buildBoardLanes('priority', columns, []).find(
		(lane) => lane.priority === 'LOW',
	)!
	const result = moveTaskInLane(
		columns,
		{ taskId: 'task-a', toColumnId: 'TODO', toIndex: 0 },
		lane,
	)
	expect(result[0]!.tasks[0]!.priority).toBe('LOW')
	expect(result[0]!.tasks[0]!.boardColumnId).toBe('TODO')
	expect(columns[0]!.tasks[0]!.priority).toBe('HIGH')
})
it('вставляет перед видимым якорем группы, сохраняя скрытые задачи', () => {
	const columns = createBoardColumnsFixture()
	columns[1]!.tasks = ['hidden', 'anchor', 'last'].map((id) =>
		createBoardTaskFixture({ id, priority: id === 'anchor' ? 'LOW' : 'HIGH' }),
	)
	const lane = buildBoardLanes('priority', columns, []).find(
		(lane) => lane.priority === 'LOW',
	)!
	const result = moveTaskInLane(
		columns,
		{ taskId: 'task-a', toColumnId: 'DONE', toIndex: 0 },
		lane,
	)
	expect(result[1]!.tasks.map((task) => task.id)).toEqual([
		'hidden',
		'task-a',
		'anchor',
		'last',
	])
	expect(result[1]!.tasks[1]!.priority).toBe('LOW')
})
it('обновляет исполнителя и его представление, включая снятие назначения', () => {
	const columns = createBoardColumnsFixture()
	const assignee = { id: 'anna', name: 'Анна', initials: 'А' }
	const lanes = buildBoardLanes('assignee', columns, [assignee])
	const next = moveTaskInLane(
		columns,
		{ taskId: 'task-a', toColumnId: 'TODO', toIndex: 0 },
		lanes[1]!,
	)
	expect(next[0]!.tasks.find((task) => task.id === 'task-a')).toMatchObject({
		assigneeId: 'anna',
		assignee,
	})
	const free = moveTaskInLane(
		next,
		{ taskId: 'task-a', toColumnId: 'TODO', toIndex: 0 },
		lanes[0]!,
	)
	expect(free[0]!.tasks.find((task) => task.id === 'task-a')).toMatchObject({
		assigneeId: null,
		assignee: null,
	})
})
it('клавиатура проходит карточки, соседние группы и колонки', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = [createBoardTaskFixture({ priority: 'HIGH' })]
	columns[1]!.tasks = []
	const lanes = buildBoardLanes('priority', columns, []),
		task = columns[0]!.tasks[0]!
	const current = {
		taskId: task.id,
		toColumnId: 'TODO',
		toIndex: 0,
		priority: 'HIGH' as const,
	}
	expect(
		keyboardLanePlacement(columns, lanes, current, task, 'ArrowRight'),
	).toMatchObject({ toColumnId: 'DONE', priority: 'HIGH' })
	expect(keyboardLanePlacement(columns, lanes, current, task, 'ArrowDown')).toMatchObject(
		{ toColumnId: 'TODO', priority: 'MEDIUM' },
	)
	expect(keyboardLanePlacement(columns, lanes, current, task, 'ArrowUp')).toMatchObject({
		priority: 'CRITICAL',
	})
	expect(keyboardLanePlacement(columns, lanes, current, task, 'ArrowLeft')).toBeNull()
	expect(keyboardLanePlacement(columns, lanes, current, task, 'Escape')).toBeNull()
})
it('optimistic перенос обновляет оба поля вместе и не затрагивает устаревшую версию', () => {
	const view = createBoardViewFixture()
	const id = view.columns[0]!.id
	const task = view.columns[0]!.tasks[0]!
	const input = {
		fromColumnId: id,
		toColumnId: id,
		position: 0,
		expectedVersion: task.version,
		priority: 'LOW' as const,
		assigneeId: null,
	}
	expect(optimisticBoardMove(view, task.id, input).columns[0]!.tasks[0]).toMatchObject({
		priority: 'LOW',
		assigneeId: null,
	})
	expect(
		optimisticBoardMove(view, task.id, { ...input, expectedVersion: task.version + 1 }),
	).toBe(view)
	expect(
		taskInLane(
			{ ...createBoardTaskFixture(), priority: 'LOW', assigneeId: null },
			{ priority: 'LOW', assigneeId: null },
		),
	).toBe(true)
})
