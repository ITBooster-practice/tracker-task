export const navigationItems = [
	{ label: 'Возможности', href: '#features' },
	{ label: 'Превью', href: '#preview' },
	{ label: 'Deploy', href: '#deploy' },
] as const

export const featureItems = [
	{
		eyebrow: 'Kanban-first',
		title: 'Вся продуктовая работа в одном контуре',
		description:
			'Проекты, задачи и спринты собраны в единую структуру без перегруженного enterprise UI.',
	},
	{
		eyebrow: 'AI assistant',
		title: 'Подготовлено под AI-сценарии',
		description:
			'Точки расширения уже предусмотрены: генерация эпиков, помощь с описаниями и ускорение рутины команды.',
	},
	{
		eyebrow: 'Open source',
		title: 'Контроль над продуктом и данными',
		description:
			'Self-hosted подход позволяет развернуть систему внутри своей инфраструктуры и развивать ее под команду.',
	},
	{
		eyebrow: 'Easy deploy',
		title: 'Быстрый старт без тяжелого онбординга',
		description:
			'Проект рассчитан на небольшие product и engineering команды, которым нужен быстрый и понятный запуск.',
	},
] as const

export const projectCards = [
	{
		code: 'TT',
		title: 'Tracker Task',
		description: 'Основной продукт и core roadmap',
		stats: ['2 доски', '24 задачи'],
	},
	{
		code: 'MS',
		title: 'Marketing Site',
		description: 'Лендинг, контент и growth эксперименты',
		stats: ['1 доска', '12 задач'],
	},
	{
		code: 'MA',
		title: 'Mobile App',
		description: 'Клиент для мобильной команды',
		stats: ['1 доска', '8 задач'],
	},
] as const

export const taskRows = [
	{
		key: 'TT-1',
		title: 'Реализовать auth flow с refresh cookie',
		type: 'Эпик',
		status: 'В работе',
		assignee: 'Алексей',
	},
	{
		key: 'TT-2',
		title: 'Kanban доска c drag & drop',
		type: 'Стори',
		status: 'В работе',
		assignee: 'Мария',
	},
	{
		key: 'TT-3',
		title: 'Фильтры и поиск задач',
		type: 'Стори',
		status: 'К выполнению',
		assignee: 'Дмитрий',
	},
] as const

export const sprintColumns = [
	{
		title: 'Backlog',
		count: 3,
		cards: ['AI генерация эпиков', 'Экспорт задач в CSV'],
	},
	{
		title: 'In Progress',
		count: 2,
		cards: ['Auth API-сервис', 'Kanban доска c drag & drop'],
	},
	{
		title: 'Review',
		count: 1,
		cards: ['Исправить баг с отображением аватаров'],
	},
] as const

export const installSteps = [
	'git clone https://github.com/ITBooster-practice/tracker-task.git',
	'pnpm install',
	'pnpm prisma:migrate',
	'pnpm dev',
] as const

export const productNotes = [
	'Dashboard для проектов, задач и спринтов',
	'Auth flow с cookie-based refresh token',
	'Готовая база для self-hosted deployment',
] as const
