import { featureItems } from '../model/content'

function FeaturesSection() {
	return (
		<section
			id='features'
			className='rounded-[32px] border border-border/70 bg-card/45 p-5 shadow-level-2 sm:p-7 lg:p-8'
		>
			<div className='mb-8 max-w-[680px] space-y-3'>
				<p className='text-xs uppercase tracking-[0.24em] text-primary'>Features</p>
				<h2 className='text-3xl font-semibold tracking-[-0.03em] sm:text-4xl'>
					Сильные стороны продукта без сложного enterprise слоя
				</h2>
				<p className='text-sm leading-7 text-muted-foreground sm:text-base'>
					Лендинг должен показывать не просто список фич, а ценность для небольших
					продуктовых команд и internal tools сценариев.
				</p>
			</div>

			<div className='grid gap-4 lg:grid-cols-2'>
				{featureItems.map((item) => (
					<article
						key={item.title}
						className='rounded-[24px] border border-border/60 bg-background/80 p-5 shadow-level-1 sm:p-6'
					>
						<p className='mb-3 text-xs uppercase tracking-[0.24em] text-primary/90'>
							{item.eyebrow}
						</p>
						<h3 className='max-w-[520px] text-2xl font-semibold tracking-[-0.03em]'>
							{item.title}
						</h3>
						<p className='mt-4 max-w-[560px] text-sm leading-7 text-muted-foreground sm:text-base'>
							{item.description}
						</p>
					</article>
				))}
			</div>
		</section>
	)
}

export { FeaturesSection }
