import { notFound } from 'next/navigation'

import { Button } from '@repo/ui'

import { FEATURES } from '@/shared/config'

const mockTasks = [
	{
		id: 'TT-1',
		title: 'Реализовать систему авторизации',
		type: 'Эпик',
		status: 'В работе',
		priority: 'Высокий',
		assignee: 'Алексей',
	},
	{
		id: 'TT-2',
		title: 'Kanban доска с drag & drop',
		type: 'Стори',
		status: 'В работе',
		priority: 'Высокий',
		assignee: 'Мария',
	},
	{
		id: 'TT-3',
		title: 'Фильтры и поиск задач',
		type: 'Стори',
		status: 'К выполнению',
		priority: 'Средний',
		assignee: 'Дмитрий',
	},
	{
		id: 'TT-4',
		title: 'Исправить баг с отображением аватаров',
		type: 'Баг',
		status: 'Ревью',
		priority: 'Высокий',
		assignee: 'Елена',
	},
	{
		id: 'TT-5',
		title: 'Настроить CI/CD pipeline',
		type: 'Тех. долг',
		status: 'Готово',
		priority: 'Средний',
		assignee: 'Павел',
	},
] as const

const typeBadgeClassName: Record<(typeof mockTasks)[number]['type'], string> = {
	Эпик: 'border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/20 dark:text-violet-200',
	Стори:
		'border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/20 dark:text-sky-200',
	Баг: 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/20 dark:text-rose-200',
	'Тех. долг':
		'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-200',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function TasksPage() {
	if (!FEATURES.TASKS) {
		notFound()
	}

	await sleep(1000)

	return (
		<div className='bg-background text-foreground w-full h-full'>
			<div className='mx-auto flex w-full max-w-[2100px] flex-col gap-8 px-5 py-8 md:px-8'>
				<header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
					<h1 className='text-3xl font-semibold tracking-tight'>Задачи</h1>
					<Button className='h-10 rounded-[var(--radius-control)] bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary/90'>
						Создать задачу
					</Button>
				</header>

				<section className='grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_0.75fr_0.8fr_0.85fr]'>
					<input
						type='text'
						placeholder='Поиск по названию или ключу...'
						className='h-10 rounded-[var(--radius-control)] border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					/>
					<select className='h-10 rounded-[var(--radius-control)] border border-border bg-background px-3 text-base text-foreground'>
						<option>Все типы</option>
					</select>
					<select className='h-10 rounded-[var(--radius-control)] border border-border bg-background px-3 text-base text-foreground'>
						<option>Все статусы</option>
					</select>
					<select className='h-10 rounded-[var(--radius-control)] border border-border bg-background px-3 text-base text-foreground'>
						<option>Все</option>
					</select>
				</section>

				<div className='overflow-x-auto rounded-[var(--radius-surface)] border border-border bg-card'>
					<table className='min-w-full border-collapse'>
						<thead className='border-b border-border'>
							<tr className='text-left text-base text-muted-foreground'>
								<th className='w-12 px-4 py-4'>
									<span className='block h-5 w-5 rounded-md border-2 border-primary' />
								</th>
								<th className='min-w-28 px-3 py-4 font-semibold'>Ключ</th>
								<th className='min-w-[360px] px-3 py-4 font-semibold'>Название</th>
								<th className='min-w-28 px-3 py-4 font-semibold'>Тип</th>
								<th className='min-w-36 px-3 py-4 font-semibold'>Статус</th>
								<th className='min-w-24 px-3 py-4 font-semibold'>Приор.</th>
								<th className='min-w-36 px-3 py-4 font-semibold'>Исполнитель</th>
							</tr>
						</thead>
						<tbody>
							{mockTasks?.map((task) => (
								<tr key={task.id} className='border-b border-border last:border-b-0'>
									<td className='px-4 py-3'>
										<span className='block h-5 w-5 rounded-md border-2 border-primary' />
									</td>
									<td className='px-3 py-3 text-xl text-muted-foreground'>{task.id}</td>
									<td className='px-3 py-3 text-xl font-medium text-foreground'>
										{task.title}
									</td>
									<td className='px-3 py-3'>
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${typeBadgeClassName[task.type]}`}
										>
											{task.type}
										</span>
									</td>
									<td className='px-3 py-3 text-xl text-foreground'>{task.status}</td>
									<td className='px-3 py-3 text-xl text-foreground'>{task.priority}</td>
									<td className='px-3 py-3 text-xl text-foreground'>{task.assignee}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
