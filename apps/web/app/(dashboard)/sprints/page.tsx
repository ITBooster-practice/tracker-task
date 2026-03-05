import { FEATURES } from '@/hooks/use-feature-flag'
import { notFound } from 'next/navigation'

import { Card, CardContent } from '@repo/ui'

type SprintTask = {
	id: string
	title: string
	type: 'Эпик' | 'Стори' | 'Баг'
	tags: string[]
}

const sprintColumns: Array<{
	name: string
	tasks: SprintTask[]
}> = [
	{
		name: 'Backlog',
		tasks: [
			{
				id: 'TT-7',
				title: 'Realtime уведомления через WebSocket',
				type: 'Стори',
				tags: ['backend', 'realtime'],
			},
			{
				id: 'TT-8',
				title: 'AI генерация эпиков из описания фичи',
				type: 'Эпик',
				tags: ['ai', 'feature'],
			},
		],
	},
	{
		name: 'To Do',
		tasks: [
			{
				id: 'TT-3',
				title: 'Фильтры и поиск задач',
				type: 'Стори',
				tags: ['ui', 'search'],
			},
			{
				id: 'TT-9',
				title: 'Система ролей и прав доступа',
				type: 'Стори',
				tags: ['auth', 'roles'],
			},
		],
	},
	{
		name: 'In Progress',
		tasks: [
			{
				id: 'TT-1',
				title: 'Реализовать систему авторизации',
				type: 'Эпик',
				tags: ['auth', 'security'],
			},
			{
				id: 'TT-2',
				title: 'Kanban доска c drag & drop',
				type: 'Стори',
				tags: ['ui', 'core'],
			},
		],
	},
]

const typeClassName: Record<SprintTask['type'], string> = {
	Эпик: 'bg-violet-500/20 text-violet-300',
	Стори: 'bg-blue-500/20 text-blue-300',
	Баг: 'bg-red-500/20 text-red-300',
}

export default function SprintsPage() {
	if (!FEATURES.SPRINTS) {
		notFound()
	}

	return (
		<div className='bg-background text-foreground w-full h-full'>
			<div className='mx-auto flex w-full max-w-[1700px] flex-col gap-4 px-3 py-4 md:px-5'>
				<header className='rounded-lg border border-border bg-card px-3 py-2.5'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-2xl font-semibold tracking-tight'>Sprint Board</h1>
							<p className='text-sm text-foreground'>Tracker Task</p>
						</div>
						<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
							<select className='h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground'>
								<option>Все типы</option>
							</select>
							<select className='h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground'>
								<option>Все</option>
							</select>
						</div>
					</div>
				</header>

				<section className='grid grid-cols-1 gap-3 xl:grid-cols-3'>
					{sprintColumns.map((column) => (
						<div
							key={column.name}
							className='rounded-lg border border-border bg-background p-2.5'
						>
							<div className='mb-2.5 flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-foreground'>
									{column.name}{' '}
									<span className='rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground'>
										{column.tasks.length}
									</span>
								</h2>
								<button
									type='button'
									className='h-6 rounded-md border border-border px-2 text-xs text-foreground'
								>
									Добавить
								</button>
							</div>

							<div className='space-y-2.5'>
								{column.tasks.map((task) => (
									<Card
										key={task.id}
										className='gap-2 rounded-lg border-border bg-card py-0'
									>
										<CardContent className='space-y-2.5 px-3 py-3 text-foreground'>
											<div className='flex items-center gap-2'>
												<span
													className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeClassName[task.type]}`}
												>
													{task.type}
												</span>
												<span className='text-xs text-foreground'>{task.id}</span>
											</div>

											<p className='text-lg font-medium leading-snug text-foreground'>
												{task.title}
											</p>

											<div className='flex flex-wrap gap-1.5'>
												{task.tags.map((tag) => (
													<span
														key={tag}
														className='rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground'
													>
														{tag}
													</span>
												))}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					))}
				</section>
			</div>
		</div>
	)
}
