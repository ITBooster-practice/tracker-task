import { BOARD_COLUMNS } from './constants'
import type { BoardAssignee, BoardComment, BoardHistoryEntry, BoardTask } from './types'

const boardAssignees = {
	alexey: { id: 'alexey', name: 'Алексей Морозов', initials: 'AM' },
	anna: { id: 'anna', name: 'Анна Ким', initials: 'AK' },
	denis: { id: 'denis', name: 'Денис Волков', initials: 'DV' },
	maria: { id: 'maria', name: 'Мария Орлова', initials: 'MO' },
} satisfies Record<string, BoardAssignee>

const boardCurrentUser: BoardAssignee = {
	id: 'alexander',
	name: 'Александр',
	initials: 'AL',
}

const createComment = (
	id: string,
	author: BoardAssignee,
	content: string,
	createdAtLabel: string,
): BoardComment => ({
	id,
	author,
	content,
	createdAtLabel,
})

const createHistoryEntry = (
	id: string,
	action: string,
	createdAtLabel: string,
	actor?: BoardAssignee,
): BoardHistoryEntry => ({
	id,
	action,
	actor,
	createdAtLabel,
})

const createTask = (task: BoardTask): BoardTask => task

const boardTasks = {
	BACKLOG: [
		createTask({
			id: 'task-101',
			key: 'SPR-101',
			title: 'Сверстать новый layout для страницы доски',
			description:
				'Собрать компактный layout: header со сводкой, toolbar с фильтрами и сам kanban с колонками без визуального шума.',
			type: 'Стори',
			priority: 'HIGH',
			columnId: 'BACKLOG',
			tags: ['ui', 'layout'],
			assignee: boardAssignees.anna,
			deadline: '2026-04-22',
			checklist: { completed: 3, total: 6 },
			comments: [
				createComment(
					'comment-101',
					boardAssignees.anna,
					'Сетки и отступы уже выровняла, осталось добить мобильную адаптацию.',
					'Сегодня, 09:12',
				),
			],
			history: [
				createHistoryEntry(
					'history-101',
					'Задача добавлена в бэклог спринта',
					'Вчера, 18:40',
					boardAssignees.alexey,
				),
			],
			createdAtLabel: 'Вчера, 18:40',
		}),
		createTask({
			id: 'task-102',
			key: 'SPR-102',
			title: 'Подготовить моковый store под будущую интеграцию с backend',
			description:
				'Нужен Zustand store с простыми action-ами для move, фильтров, открытия карточки и добавления комментариев.',
			type: 'Задача',
			priority: 'HIGH',
			columnId: 'BACKLOG',
			tags: ['zustand', 'mock-api'],
			assignee: boardAssignees.alexey,
			deadline: '2026-04-23',
			checklist: { completed: 1, total: 4 },
			comments: [],
			history: [
				createHistoryEntry(
					'history-102',
					'Сформулировали контракт стора под UI',
					'Сегодня, 08:25',
					boardAssignees.maria,
				),
			],
			createdAtLabel: 'Сегодня, 08:25',
		}),
	],
	TODO: [
		createTask({
			id: 'task-103',
			key: 'SPR-103',
			title: 'Сделать фильтры по типу и исполнителю',
			description:
				'Фильтры должны мгновенно сужать доску, но не ломать порядок карточек. Пока drag & drop на отфильтрованной выборке отключаем.',
			type: 'Стори',
			priority: 'MEDIUM',
			columnId: 'TODO',
			tags: ['filters', 'toolbar'],
			assignee: boardAssignees.maria,
			deadline: '2026-04-24',
			checklist: { completed: 0, total: 3 },
			comments: [],
			history: [
				createHistoryEntry(
					'history-103',
					'Добавлена в текущий спринт после grooming',
					'Сегодня, 10:05',
					boardAssignees.alexey,
				),
			],
			createdAtLabel: 'Сегодня, 10:05',
		}),
		createTask({
			id: 'task-104',
			key: 'SPR-104',
			title: 'Покрыть reorder-логику unit тестами',
			description:
				'Протестировать перенос между колонками, перестановку внутри колонки и обновление комментариев в сторе.',
			type: 'Тех. долг',
			priority: 'MEDIUM',
			columnId: 'TODO',
			tags: ['tests', 'vitest'],
			assignee: boardAssignees.denis,
			deadline: '2026-04-25',
			checklist: { completed: 0, total: 2 },
			comments: [],
			history: [],
			createdAtLabel: 'Сегодня, 11:10',
		}),
	],
	IN_PROGRESS: [
		createTask({
			id: 'task-105',
			key: 'SPR-105',
			title: 'Сделать drag preview между колонками без дёрганий',
			description:
				'Во время перетаскивания карточки список должен плавно расходиться и показывать конечную позицию ещё до drop.',
			type: 'Стори',
			priority: 'HIGH',
			columnId: 'IN_PROGRESS',
			tags: ['dnd', 'ux'],
			assignee: boardAssignees.anna,
			deadline: '2026-04-26',
			checklist: { completed: 4, total: 5 },
			comments: [
				createComment(
					'comment-105',
					boardAssignees.anna,
					'Нужен отдельный overlay для активной карточки, иначе браузерный ghost выглядит тяжело.',
					'Сегодня, 12:35',
				),
				createComment(
					'comment-106',
					boardAssignees.alexey,
					'Согласен, и лучше сразу ограничить drag на включённых фильтрах.',
					'Сегодня, 12:51',
				),
			],
			history: [
				createHistoryEntry(
					'history-105',
					'Карточка переведена в активную разработку',
					'Сегодня, 11:42',
					boardAssignees.anna,
				),
			],
			createdAtLabel: 'Сегодня, 11:42',
		}),
		createTask({
			id: 'task-106',
			key: 'SPR-106',
			title: 'Собрать диалог деталей задачи',
			description:
				'Открытие задачи из карточки должно вести в подробный drawer с описанием, комментариями и историей изменений.',
			type: 'Задача',
			priority: 'LOW',
			columnId: 'IN_PROGRESS',
			tags: ['dialog', 'details'],
			assignee: boardAssignees.maria,
			deadline: '2026-04-27',
			checklist: { completed: 2, total: 4 },
			comments: [
				createComment(
					'comment-107',
					boardAssignees.maria,
					'Осталось связать форму комментариев со стором.',
					'Сегодня, 13:08',
				),
			],
			history: [
				createHistoryEntry(
					'history-106',
					'Добавлен первый UI набросок',
					'Сегодня, 10:58',
					boardAssignees.maria,
				),
			],
			createdAtLabel: 'Сегодня, 10:58',
		}),
	],
	IN_REVIEW: [
		createTask({
			id: 'task-107',
			key: 'SPR-107',
			title: 'Привести badges статусов к единому виду',
			description:
				'Нужно выровнять стили статусов и приоритетов, чтобы карточки не выглядели разрозненно на доске.',
			type: 'Баг',
			priority: 'MEDIUM',
			columnId: 'IN_REVIEW',
			tags: ['ui-kit', 'badges'],
			assignee: boardAssignees.denis,
			deadline: '2026-04-21',
			checklist: { completed: 2, total: 2 },
			comments: [
				createComment(
					'comment-108',
					boardAssignees.denis,
					'Жду только финальный pass по цветам в светлой теме.',
					'Сегодня, 14:20',
				),
			],
			history: [
				createHistoryEntry(
					'history-107',
					'Изменения отправлены на ревью',
					'Сегодня, 14:02',
					boardAssignees.denis,
				),
			],
			createdAtLabel: 'Сегодня, 09:50',
		}),
	],
	DONE: [
		createTask({
			id: 'task-108',
			key: 'SPR-108',
			title: 'Подготовить feature flag для страницы доски',
			description:
				'Страница доски скрыта за флагом до момента, пока вся связка mock-ui не станет устойчивой.',
			type: 'Задача',
			priority: 'LOW',
			columnId: 'DONE',
			tags: ['feature-flag', 'config'],
			assignee: boardAssignees.alexey,
			deadline: '2026-04-18',
			checklist: { completed: 2, total: 2 },
			comments: [],
			history: [
				createHistoryEntry(
					'history-108',
					'Флаг добавлен в frontend config',
					'Вчера, 19:15',
					boardAssignees.alexey,
				),
			],
			createdAtLabel: 'Вчера, 19:15',
		}),
		createTask({
			id: 'task-109',
			key: 'SPR-109',
			title: 'Почистить sidebar routing для нового раздела',
			description:
				'Навигация на `/boards` должна работать через общий sidebar config без ручных breadcrumbs в странице.',
			type: 'Тех. долг',
			priority: 'LOW',
			columnId: 'DONE',
			tags: ['navigation', 'dashboard'],
			assignee: boardAssignees.anna,
			deadline: '2026-04-19',
			checklist: { completed: 1, total: 1 },
			comments: [],
			history: [
				createHistoryEntry(
					'history-109',
					'Маршрут подключён к dashboard navigation',
					'Вчера, 17:46',
					boardAssignees.anna,
				),
			],
			createdAtLabel: 'Вчера, 17:46',
		}),
	],
} as const

export const boardMock = {
	currentUser: boardCurrentUser,
	board: {
		id: 'board-24',
		name: 'Спринт 24',
		projectName: 'Tracker Task',
		periodLabel: '15 апреля - 28 апреля',
		goal: 'Сделать доску живой, приятной в работе и готовой к быстрой замене mock-слоя на API.',
	},
	columns: BOARD_COLUMNS.map((column) => ({
		...column,
		tasks: [...boardTasks[column.id]],
	})),
}
