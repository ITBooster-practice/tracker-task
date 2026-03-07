import { installSteps } from '../model/content'

function DeploySection() {
	return (
		<section
			id='deploy'
			className='grid gap-4 rounded-[32px] border border-border/70 bg-card/45 p-5 shadow-level-2 sm:p-7 lg:grid-cols-[0.95fr_1.05fr]'
		>
			<div className='space-y-4'>
				<p className='text-xs uppercase tracking-[0.24em] text-primary'>Deploy</p>
				<h2 className='text-3xl font-semibold tracking-[-0.03em] sm:text-4xl'>
					Разворачивай на своей инфраструктуре
				</h2>
				<p className='max-w-[560px] text-sm leading-7 text-muted-foreground sm:text-base'>
					Секция для self-hosted сценария: быстрый старт, прозрачная схема окружения и
					готовая база под дальнейший деплой в Coolify или другой PaaS.
				</p>
			</div>

			<div className='rounded-[26px] border border-border/70 bg-background/90 p-4 shadow-level-1 sm:p-5'>
				<div className='mb-4 flex items-center justify-between'>
					<p className='text-sm font-medium'>Quick start</p>
					<span className='rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground'>
						terminal
					</span>
				</div>

				<div className='overflow-hidden rounded-[22px] border border-border/70 bg-card/70'>
					{installSteps.map((step, index) => (
						<div
							key={step}
							className='border-b border-border/60 px-4 py-4 font-mono text-sm text-muted-foreground last:border-b-0'
						>
							<span className='mr-3 text-primary'>
								{String(index + 1).padStart(2, '0')}
							</span>
							{step}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export { DeploySection }
