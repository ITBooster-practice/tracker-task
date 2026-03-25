import { features } from '../model/content'

function FeaturesSection() {
	return (
		<section id='features' className='border-t border-border py-[80px]'>
			<div className='mx-auto max-w-[1200px]'>
				<div className='animate-home-fade-up mb-[48px] text-center'>
					<h2 className='mb-3 text-[28px] font-bold tracking-tight md:text-[32px]'>
						Всё, что нужно для работы
					</h2>
					<p className='mx-auto max-w-[500px] text-base text-muted-foreground'>
						Без перегруза и без лишнего. Только то, что реально используется каждый день.
					</p>
				</div>
				<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{features.map((feature) => {
						const Icon = feature.icon

						return (
							<article
								key={feature.title}
								className={`animate-home-fade-up rounded-[var(--radius-surface)] border p-6 transition-all duration-300 hover:-translate-y-0.5 ${
									feature.highlight
										? 'border-accent/30 bg-accent/5'
										: 'border-border bg-card hover:border-primary/30'
								}`}
							>
								<div
									className={`mb-5 flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius-control)-2px)] ${
										feature.highlight ? 'bg-accent/10' : 'bg-primary/10'
									}`}
								>
									<Icon
										className={`h-5 w-5 ${
											feature.highlight ? 'text-accent' : 'text-primary'
										}`}
									/>
								</div>
								<h3 className='mb-2 text-xl font-semibold'>{feature.title}</h3>
								<p className='text-base text-muted-foreground'>{feature.description}</p>
							</article>
						)
					})}
				</div>
			</div>
		</section>
	)
}

export { FeaturesSection }
