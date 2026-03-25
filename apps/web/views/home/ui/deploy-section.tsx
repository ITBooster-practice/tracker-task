import { Button } from '@repo/ui'
import { BookOpen, Github, Terminal } from '@repo/ui/icons'

import { deploySteps } from '../model/content'

function DeploySection() {
	return (
		<section id='deploy' className='border-t border-border py-[80px]'>
			<div className='mx-auto max-w-[1200px]'>
				<div className='animate-home-fade-up mb-[48px] text-center'>
					<h2 className='mb-3 text-[28px] font-bold tracking-tight md:text-[32px]'>
						Развернуть за 4 шага
					</h2>
					<p className='text-base text-muted-foreground'>Docker Compose — и вы в деле</p>
				</div>
				<div className='animate-home-fade-up-delay mx-auto max-w-[640px]'>
					<div className='overflow-hidden rounded-[var(--radius-surface)] border border-border bg-card'>
						<div className='flex items-center gap-2 border-b border-border px-6 py-4'>
							<Terminal className='h-4 w-4 text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>Terminal</span>
						</div>
						<div className='space-y-4 p-6'>
							{deploySteps.map((step) => (
								<div key={step.step} className='flex items-start gap-4'>
									<span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
										{step.step}
									</span>
									<code className='break-all font-mono text-sm text-foreground/80'>
										{step.code}
									</code>
								</div>
							))}
						</div>
					</div>
					<div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
						<Button variant='outline' asChild>
							<a href='#'>
								<BookOpen className='h-4 w-4' />
								Документация
							</a>
						</Button>
						<Button asChild>
							<a
								href='https://github.com/ITBooster-practice/tracker-task'
								target='_blank'
								rel='noopener noreferrer'
							>
								<Github className='h-4 w-4' />
								Репозиторий
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

export { DeploySection }
