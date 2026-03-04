import { FEATURES } from '@/hooks/use-feature-flag'
import { notFound } from 'next/navigation'

import { Button } from '@repo/ui'

const tasks = [
	{
		key: 'TT-1',
		title: 'Реализовать систему авторизации',
		type: 'Эпик',
		status: 'В работе',
		priority: 'Высокий',
		assignee: 'Алексей',
	},
	{
		key: 'TT-2',
		title: 'Kanban доска с drag & drop',
		type: 'Стори',
		status: 'В работе',
		priority: 'Высокий',
		assignee: 'Мария',
	},
	{
		key: 'TT-3',
		title: 'Фильтры и поиск задач',
		type: 'Стори',
		status: 'К выполнению',
		priority: 'Средний',
		assignee: 'Дмитрий',
	},
	{
		key: 'TT-4',
		title: 'Исправить баг с отображением аватаров',
		type: 'Баг',
		status: 'Ревью',
		priority: 'Высокий',
		assignee: 'Елена',
	},
	{
		key: 'TT-5',
		title: 'Настроить CI/CD pipeline',
		type: 'Тех. долг',
		status: 'Готово',
		priority: 'Средний',
		assignee: 'Павел',
	},
] as const

const typeBadgeClassName: Record<(typeof tasks)[number]['type'], string> = {
	Эпик: 'bg-violet-500/20 text-violet-300',
	Стори: 'bg-blue-500/20 text-blue-300',
	Баг: 'bg-red-500/20 text-red-300',
	'Тех. долг': 'bg-amber-500/20 text-amber-300',
}

export default function TasksPage() {
	if (!FEATURES.TASKS) {
		notFound()
	}

	return (
		<div className='bg-slate-950 text-slate-100 w-full h-full'>
			<div className='mx-auto flex w-full max-w-[2100px] flex-col gap-8 px-5 py-8 md:px-8'>
				<header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
					<h1 className='text-3xl font-semibold tracking-tight'>Задачи</h1>
					<Button className='h-10 rounded-lg bg-blue-500 px-5 text-base font-medium hover:bg-blue-400'>
						Создать задачу
					</Button>
				</header>

				<section className='grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_0.75fr_0.8fr_0.85fr]'>
					<input
						type='text'
						placeholder='Поиск по названию или ключу...'
						className='h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
					/>
					<select className='h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-slate-100'>
						<option>Все типы</option>
					</select>
					<select className='h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-slate-100'>
						<option>Все статусы</option>
					</select>
					<select className='h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-slate-100'>
						<option>Все</option>
					</select>
				</section>

				<div className='overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900'>
					<table className='min-w-full border-collapse'>
						<thead className='border-b border-slate-800'>
							<tr className='text-left text-base text-slate-400'>
								<th className='w-12 px-4 py-4'>
									<span className='block h-5 w-5 rounded-md border-2 border-blue-500' />
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
							{tasks.map((task) => (
								<tr key={task.key} className='border-b border-slate-800 last:border-b-0'>
									<td className='px-4 py-3'>
										<span className='block h-5 w-5 rounded-md border-2 border-blue-500' />
									</td>
									<td className='px-3 py-3 text-xl text-slate-400'>{task.key}</td>
									<td className='px-3 py-3 text-xl font-medium text-slate-100'>
										{task.title}
									</td>
									<td className='px-3 py-3'>
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${typeBadgeClassName[task.type]}`}
										>
											{task.type}
										</span>
									</td>
									<td className='px-3 py-3 text-xl text-slate-200'>{task.status}</td>
									<td className='px-3 py-3 text-xl text-slate-200'>{task.priority}</td>
									<td className='px-3 py-3 text-xl text-slate-200'>{task.assignee}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
