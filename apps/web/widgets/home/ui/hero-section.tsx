import Link from 'next/link'

import { productNotes, sprintColumns } from '../model/content'

function HeroSection() {
	return (
		<section className='grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start'>
			<div className='space-y-8'>
				<div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary'>
					<span className='h-2 w-2 rounded-full bg-primary' />
					Self-hosted task tracker
				</div>

				<div className='space-y-5'>
					<h1 className='max-w-[760px] text-[42px] font-semibold leading-[0.96] tracking-[-0.04em] sm:text-[56px] lg:text-[74px]'>
						Tracker Task для команд, которым нужен быстрый и понятный workspace.
					</h1>
					<p className='max-w-[660px] text-base leading-7 text-muted-foreground sm:text-lg'>
						Минималистичная альтернатива Jira и тяжеловесным системам: проекты, задачи,
						спринты, AI-помощник и готовая основа для deploy в своей инфраструктуре.
					</p>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					{productNotes.map((item) => (
						<div
							key={item}
							className='rounded-2xl border border-border/60 bg-card/55 px-4 py-4 text-sm text-muted-foreground shadow-level-1'
						>
							{item}
						</div>
					))}
				</div>
			</div>

			<div className='flex flex-col gap-4 lg:pt-16 xl:pt-20'>
				<div className='relative overflow-hidden rounded-[30px] border border-primary/20 bg-card/70 p-5 shadow-level-3 sm:p-6'>
					<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,139,255,0.26),transparent_52%)]' />
					<div className='relative space-y-5'>
						<div className='flex items-start justify-between gap-4'>
							<div className='space-y-3'>
								<p className='text-xs uppercase tracking-[0.24em] text-primary'>
									Быстрый старт
								</p>
								<h2 className='max-w-[320px] text-2xl font-semibold tracking-[-0.03em]'>
									Создай workspace и переходи к задачам без долгого онбординга.
								</h2>
							</div>
							<div className='rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary'>
								2 минуты
							</div>
						</div>

						<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
							<Link
								href='/projects'
								className='inline-flex min-h-14 items-center justify-center rounded-[22px] bg-primary px-7 text-base font-semibold text-primary-foreground shadow-level-2 transition-transform hover:-translate-y-0.5 hover:opacity-95'
							>
								Создать workspace
							</Link>
							<Link
								href='#preview'
								className='inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background/75 px-5 text-sm text-foreground transition-colors hover:bg-card'
							>
								Смотреть интерфейс
							</Link>
						</div>

						<div className='grid gap-2 sm:grid-cols-3'>
							<div className='rounded-2xl border border-border/60 bg-background/55 px-3 py-3'>
								<p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
									Deploy
								</p>
								<p className='mt-2 text-sm font-medium'>Self-hosted ready</p>
							</div>
							<div className='rounded-2xl border border-border/60 bg-background/55 px-3 py-3'>
								<p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
									Flow
								</p>
								<p className='mt-2 text-sm font-medium'>Projects, tasks, sprints</p>
							</div>
							<div className='rounded-2xl border border-border/60 bg-background/55 px-3 py-3'>
								<p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
									AI
								</p>
								<p className='mt-2 text-sm font-medium'>Prepared product hooks</p>
							</div>
						</div>
					</div>
				</div>

				<div className='rounded-[28px] border border-border/80 bg-card/80 p-4 shadow-level-3'>
					<div className='rounded-[22px] border border-border/70 bg-background/90 p-4'>
						<div className='mb-4 flex items-center justify-between'>
							<div>
								<p className='text-xs uppercase tracking-[0.24em] text-primary'>
									Preview
								</p>
								<h2 className='mt-2 text-xl font-semibold'>Product board</h2>
							</div>
							<div className='rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground'>
								Live preview
							</div>
						</div>

						<div className='grid gap-3 md:grid-cols-3'>
							{sprintColumns.map((column) => (
								<div
									key={column.title}
									className='rounded-2xl border border-border/60 bg-card/70 p-3'
								>
									<div className='mb-3 flex items-center justify-between'>
										<h3 className='text-sm font-medium'>{column.title}</h3>
										<span className='rounded-full bg-primary/15 px-2 py-1 text-xs text-primary'>
											{column.count}
										</span>
									</div>
									<div className='space-y-2'>
										{column.cards.map((card) => (
											<div
												key={card}
												className='rounded-xl border border-border/60 bg-background/85 px-3 py-3 text-sm text-muted-foreground'
											>
												{card}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export { HeroSection }
