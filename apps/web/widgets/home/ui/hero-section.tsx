import Link from 'next/link'

import { productNotes, sprintColumns } from '../model/content'

function HeroSection() {
	return (
		<section className='grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end'>
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

				<div className='flex flex-col gap-3 sm:flex-row'>
					<Link
						href='/projects'
						className='inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 hover:opacity-95'
					>
						Создать workspace
					</Link>
					<Link
						href='#preview'
						className='inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card/70 px-6 text-sm text-foreground transition-colors hover:bg-card'
					>
						Смотреть интерфейс
					</Link>
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

			<div className='rounded-[28px] border border-border/80 bg-card/80 p-4 shadow-level-3'>
				<div className='rounded-[22px] border border-border/70 bg-background/90 p-4'>
					<div className='mb-4 flex items-center justify-between'>
						<div>
							<p className='text-xs uppercase tracking-[0.24em] text-primary'>Preview</p>
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
		</section>
	)
}

export { HeroSection }
