import { projectCards, taskRows } from '../model/content'

function PreviewSection() {
	return (
		<section id='preview' className='grid gap-4 lg:grid-cols-[1.05fr_0.95fr] xl:gap-5'>
			<div className='rounded-[30px] border border-border/70 bg-card/50 p-5 shadow-level-2 sm:p-6'>
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<p className='text-xs uppercase tracking-[0.24em] text-primary'>Projects</p>
						<h2 className='mt-2 text-2xl font-semibold'>Страница проектов</h2>
					</div>
					<div className='rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground'>
						Create project
					</div>
				</div>

				<div className='grid gap-4 xl:grid-cols-3'>
					{projectCards.map((card) => (
						<article
							key={card.title}
							className='rounded-[24px] border border-border/70 bg-background/80 p-5'
						>
							<div className='mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-xl font-semibold text-primary'>
								{card.code}
							</div>
							<h3 className='text-xl font-semibold'>{card.title}</h3>
							<p className='mt-3 text-sm leading-6 text-muted-foreground'>
								{card.description}
							</p>
							<div className='mt-6 flex flex-wrap gap-2'>
								{card.stats.map((stat) => (
									<span
										key={stat}
										className='rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground'
									>
										{stat}
									</span>
								))}
							</div>
						</article>
					))}
				</div>
			</div>

			<div className='grid gap-4'>
				<div className='rounded-[30px] border border-border/70 bg-card/50 p-5 shadow-level-2 sm:p-6'>
					<div className='mb-5 flex items-center justify-between'>
						<div>
							<p className='text-xs uppercase tracking-[0.24em] text-primary'>Tasks</p>
							<h2 className='mt-2 text-2xl font-semibold'>Таблица задач</h2>
						</div>
					</div>

					<div className='overflow-hidden rounded-[22px] border border-border/70 bg-background/80'>
						<div className='grid grid-cols-[88px_minmax(0,1fr)_88px_132px] gap-3 border-b border-border/70 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground'>
							<span>Ключ</span>
							<span>Название</span>
							<span>Тип</span>
							<span>Статус</span>
						</div>

						{taskRows.map((row) => (
							<div
								key={row.key}
								className='grid grid-cols-[88px_minmax(0,1fr)_88px_132px] gap-3 border-b border-border/60 px-4 py-4 text-sm last:border-b-0'
							>
								<span className='text-muted-foreground'>{row.key}</span>
								<div>
									<p className='font-medium text-foreground'>{row.title}</p>
									<p className='mt-1 text-xs text-muted-foreground'>
										Исполнитель: {row.assignee}
									</p>
								</div>
								<span className='text-muted-foreground'>{row.type}</span>
								<span className='text-foreground'>{row.status}</span>
							</div>
						))}
					</div>
				</div>

				<div className='rounded-[30px] border border-border/70 bg-card/50 p-5 shadow-level-2 sm:p-6'>
					<p className='text-xs uppercase tracking-[0.24em] text-primary'>Positioning</p>
					<h2 className='mt-2 text-2xl font-semibold'>Open Source & Self-Hosted</h2>
					<p className='mt-4 text-sm leading-7 text-muted-foreground'>
						Контроль над roadmap, доступом и данными без привязки к внешней SaaS
						платформе.
					</p>
				</div>
			</div>
		</section>
	)
}

export { PreviewSection }
