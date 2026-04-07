import { notFound } from 'next/navigation'

import { Button } from '@repo/ui'

import {
	TaskPriority,
	TaskPriorityBadge,
	TaskStatus,
	TaskStatusBadge,
	TaskType,
	TaskTypeBadge,
} from '@/entities/task'
import { FEATURES } from '@/shared/config'

interface Task {
	id: string
	title: string
	type: TaskType
	status: TaskStatus
	priority: TaskPriority
	assignee: string
}

const mockTasks: Task[] = [
	{
		id: 'TT-1',
		title: 'Реализовать систему авторизации',
		type: 'Эпик',
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		assignee: 'Алексей',
	},
	{
		id: 'TT-2',
		title: 'Kanban доска с drag & drop',
		type: 'Стори',
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		assignee: 'Мария',
	},
	{
		id: 'TT-3',
		title: 'Фильтры и поиск задач',
		type: 'Стори',
		status: 'TODO',
		priority: 'MEDIUM',
		assignee: 'Дмитрий',
	},
	{
		id: 'TT-4',
		title: 'Исправить баг с отображением аватаров',
		type: 'Баг',
		status: 'IN_REVIEW',
		priority: 'HIGH',
		assignee: 'Елена',
	},
	{
		id: 'TT-5',
		title: 'Настроить CI/CD pipeline',
		type: 'Тех. долг',
		status: 'DONE',
		priority: 'MEDIUM',
		assignee: 'Павел',
	},
] as const

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
									<span className='block h-5 w-5 rounded-[calc(var(--radius-control)-2px)] border-2 border-primary' />
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
										<div className='block size-5 rounded-[calc(var(--radius-control)-2px)] border-2 border-primary' />
									</td>
									<td className='px-3 py-3 text-body text-muted-foreground'>
										<span>{task.id}</span>
									</td>
									<td className='px-3 py-3 text-body font-medium text-foreground'>
										<span>{task.title}</span>
									</td>
									<td className='px-3 py-3 leading-none'>
										<TaskTypeBadge type={task.type} />
									</td>
									<td className='px-3 py-3 leading-none'>
										<TaskStatusBadge status={task.status} />
									</td>
									<td className='px-3 py-3'>
										<TaskPriorityBadge priority={task.priority} />
									</td>
									<td className='px-3 py-3 text-body text-foreground'>{task.assignee}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
