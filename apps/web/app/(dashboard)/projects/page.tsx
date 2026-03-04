import { FEATURES } from '@/hooks/use-feature-flag'
import { notFound } from 'next/navigation'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui'

const projectCards = [
	{
		code: 'TT',
		name: 'Tracker Task',
		description: 'Основной продукт — трекер задач',
		boards: '2 доски',
		tasks: '24 задачи',
	},
	{
		code: 'MS',
		name: 'Marketing Site',
		description: 'Лендинг и маркетинговые страницы',
		boards: '1 доска',
		tasks: '12 задач',
	},
	{
		code: 'MA',
		name: 'Mobile App',
		description: 'Мобильное приложение трекера',
		boards: '1 доска',
		tasks: '8 задач',
	},
] as const

export default function ProjectsPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return (
		<div className='bg-slate-950 text-slate-100 w-full h-full'>
			<div className='mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-6 py-8 md:px-10 md:py-10'>
				<header className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
					<div className='space-y-2'>
						<h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>Проекты</h1>
						<p className='text-xl text-slate-400'>Product Team</p>
					</div>

					<Button className='h-16 rounded-2xl bg-blue-500 px-8 text-2xl font-medium hover:bg-blue-400 md:text-4xl'>
						Создать проект
					</Button>
				</header>

				<input
					type='text'
					placeholder='Поиск проектов...'
					className='h-16 w-full max-w-[700px] rounded-2xl border border-slate-700 bg-slate-950 px-6 text-2xl text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
				/>

				<section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
					{projectCards.map((project) => (
						<Card
							key={project.code}
							className='rounded-3xl border-slate-700 bg-slate-900 py-0'
						>
							<CardHeader className='gap-6 px-8 pt-8'>
								<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-4xl font-semibold text-blue-400'>
									{project.code}
								</div>
								<div className='space-y-3'>
									<CardTitle className='text-4xl font-semibold text-slate-100'>
										{project.name}
									</CardTitle>
									<CardDescription className='text-2xl text-slate-400'>
										{project.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className='px-8 pb-8'>
								<p className='text-xl text-slate-400'>
									{project.boards} · {project.tasks}
								</p>
							</CardContent>
						</Card>
					))}
				</section>

				<section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
					{projectCards.map((project) => (
						<Card
							key={project.code}
							className='rounded-3xl border-slate-700 bg-slate-900 py-0'
						>
							<CardHeader className='gap-6 px-8 pt-8'>
								<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-4xl font-semibold text-blue-400'>
									{project.code}
								</div>
								<div className='space-y-3'>
									<CardTitle className='text-4xl font-semibold text-slate-100'>
										{project.name}
									</CardTitle>
									<CardDescription className='text-2xl text-slate-400'>
										{project.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className='px-8 pb-8'>
								<p className='text-xl text-slate-400'>
									{project.boards} · {project.tasks}
								</p>
							</CardContent>
						</Card>
					))}
				</section>
				<section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
					{projectCards.map((project) => (
						<Card
							key={project.code}
							className='rounded-3xl border-slate-700 bg-slate-900 py-0'
						>
							<CardHeader className='gap-6 px-8 pt-8'>
								<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-4xl font-semibold text-blue-400'>
									{project.code}
								</div>
								<div className='space-y-3'>
									<CardTitle className='text-4xl font-semibold text-slate-100'>
										{project.name}
									</CardTitle>
									<CardDescription className='text-2xl text-slate-400'>
										{project.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className='px-8 pb-8'>
								<p className='text-xl text-slate-400'>
									{project.boards} · {project.tasks}
								</p>
							</CardContent>
						</Card>
					))}
				</section>

				<section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
					{projectCards.map((project) => (
						<Card
							key={project.code}
							className='rounded-3xl border-slate-700 bg-slate-900 py-0'
						>
							<CardHeader className='gap-6 px-8 pt-8'>
								<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-4xl font-semibold text-blue-400'>
									{project.code}
								</div>
								<div className='space-y-3'>
									<CardTitle className='text-4xl font-semibold text-slate-100'>
										{project.name}
									</CardTitle>
									<CardDescription className='text-2xl text-slate-400'>
										{project.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className='px-8 pb-8'>
								<p className='text-xl text-slate-400'>
									{project.boards} · {project.tasks}
								</p>
							</CardContent>
						</Card>
					))}
				</section>
			</div>
		</div>
	)
}
