import {
	createBoardColumnsFixture,
	createBoardTaskFixture,
} from '@/test/mocks/views/boards/board-ui.fixtures'
import { expect, it } from 'vitest'

import {
	emptyProjectBoardFilters,
	filterProjectBoardColumns,
	fullBoardMovePosition,
	hasProjectBoardFilters,
	parseProjectBoardFilters,
	projectBoardAssigneeOptions,
	projectBoardFilterParams,
} from '@/views/boards/model/project-board-filters'

it('читает параметры ссылки и безопасно игнорирует неизвестные enum значения', () => {
	expect(
		parseProjectBoardFilters(
			new URLSearchParams(
				'q=%D0%A2%D0%B5%D1%81%D1%82&type=BUG&priority=HIGH&assignee=anna',
			),
		),
	).toEqual({ query: 'Тест', type: 'BUG', priority: 'HIGH', assignee: 'anna' })
	expect(
		parseProjectBoardFilters(
			new URLSearchParams('type=OTHER&priority=INVALID&assignee=%20'),
		),
	).toEqual(emptyProjectBoardFilters)
})
it('сброс удаляет только параметры фильтров, сохраняя доску и посторонние параметры', () => {
	const current = new URLSearchParams(
		'boardId=other&q=test&type=TASK&priority=HIGH&assignee=anna&extra=one&extra=two',
	)
	expect(projectBoardFilterParams(current, emptyProjectBoardFilters).toString()).toBe(
		'boardId=other&extra=one&extra=two',
	)
	expect(current.get('q')).toBe('test')
	const changed = projectBoardFilterParams(current, {
		...emptyProjectBoardFilters,
		query: 'ALL',
		assignee: 'user /%1',
	})
	expect(changed.get('q')).toBe('ALL')
	expect(changed.get('assignee')).toBe('user /%1')
})
it('применяет фильтры совместно и не удаляет колонки или исходные задачи', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = [
		createBoardTaskFixture({
			id: 'match',
			title: 'Исправить поиск',
			type: 'BUG',
			priority: 'HIGH',
			assigneeId: 'anna',
		}),
		createBoardTaskFixture({
			id: 'hidden',
			type: 'TASK',
			priority: 'HIGH',
			assigneeId: 'anna',
		}),
	]
	const snapshot = structuredClone(columns)
	const result = filterProjectBoardColumns(columns, {
		query: '  ПОИСК ',
		type: 'BUG',
		priority: 'HIGH',
		assignee: 'anna',
	})
	expect(result.map((column) => column.id)).toEqual(columns.map((column) => column.id))
	expect(result[0]!.tasks.map((task) => task.id)).toEqual(['match'])
	expect(result[1]!.tasks).toEqual([])
	expect(columns).toEqual(snapshot)
})
it('ищет по видимому ключу и названию, не по имени или тегам', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = [
		createBoardTaskFixture({
			key: 'TT-ABC',
			title: 'Прототип',
			tags: ['needle'],
			assignee: { id: 'user', name: 'needle', initials: 'N' },
		}),
	]
	columns[1]!.tasks = []
	expect(
		filterProjectBoardColumns(columns, {
			...emptyProjectBoardFilters,
			query: 'tt-abc',
		})[0]!.tasks,
	).toHaveLength(1)
	expect(
		filterProjectBoardColumns(columns, {
			...emptyProjectBoardFilters,
			query: 'needle',
		})[0]!.tasks,
	).toHaveLength(0)
})
it('отдельно выбирает задачи без исполнителя', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = [
		createBoardTaskFixture({ id: 'free', assigneeId: null }),
		createBoardTaskFixture({ id: 'assigned', assigneeId: 'anna' }),
	]
	expect(
		filterProjectBoardColumns(columns, {
			...emptyProjectBoardFilters,
			assignee: 'UNASSIGNED',
		})[0]!.tasks.map((task) => task.id),
	).toEqual(['free'])
})
it.each([
	{ query: 'q' },
	{ type: 'BUG' as const },
	{ priority: 'CRITICAL' as const },
	{ assignee: 'anna' },
])('учитывает каждый фильтр при сбросе %j', (patch) => {
	expect(hasProjectBoardFilters({ ...emptyProjectBoardFilters, ...patch })).toBe(true)
	expect(hasProjectBoardFilters(emptyProjectBoardFilters)).toBe(false)
})
it('строит стабильный полный список исполнителей, включая неизвестного и недоступный выбор', () => {
	const columns = createBoardColumnsFixture()
	const options = projectBoardAssigneeOptions(
		columns,
		[{ id: 'anna', name: 'Анна', initials: 'А' }],
		'removed',
	)
	expect(options).toContainEqual({ value: 'anna', label: 'Анна' })
	expect(options).toContainEqual({ value: 'removed', label: 'Участник недоступен' })
	expect(options.some((option) => option.value === 'alexey')).toBe(true)
	expect(options.filter((option) => option.value === 'alexey')).toHaveLength(1)
	expect(options[1]).toEqual({ value: 'UNASSIGNED', label: 'Без исполнителя' })
})
it.each([
	[0, 1],
	[1, 3],
	[2, 4],
] as const)(
	'переводит видимый индекс %s в полный %s без потери скрытых задач',
	(visibleIndex, fullIndex) => {
		const columns = createBoardColumnsFixture()
		columns[1]!.tasks = ['hidden-before', 'shown-a', 'hidden-between', 'shown-b'].map(
			(id) =>
				createBoardTaskFixture({ id, priority: id.startsWith('shown') ? 'HIGH' : 'LOW' }),
		)
		const visible = filterProjectBoardColumns(columns, {
			...emptyProjectBoardFilters,
			priority: 'HIGH',
		})
		expect(fullBoardMovePosition(columns, visible, 'task-a', 'DONE', visibleIndex)).toBe(
			fullIndex,
		)
	},
)
it('перенос внутри колонки исключает исходную карточку из расчёта индекса', () => {
	const columns = createBoardColumnsFixture()
	columns[0]!.tasks = ['a', 'hidden', 'b'].map((id) =>
		createBoardTaskFixture({ id, priority: id === 'hidden' ? 'LOW' : 'HIGH' }),
	)
	const visible = filterProjectBoardColumns(columns, {
		...emptyProjectBoardFilters,
		priority: 'HIGH',
	})
	expect(fullBoardMovePosition(columns, visible, 'b', 'TODO', 0)).toBe(0)
	expect(fullBoardMovePosition(columns, visible, 'a', 'TODO', 0)).toBe(0)
	expect(fullBoardMovePosition(columns, visible, 'a', 'TODO', 1)).toBe(2)
	expect(fullBoardMovePosition(columns, visible, 'a', 'missing', 0)).toBeNull()
})
