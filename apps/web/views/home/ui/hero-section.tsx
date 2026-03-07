import Link from 'next/link'

import { Button } from '@repo/ui'
import { Play } from '@repo/ui/icons'

import { boardColumns, heroActions, heroBadge } from '../model/content'

function HeroSection() {
	const BadgeIcon = heroBadge.icon
	const SecondaryIcon = heroActions.secondary.icon

	return (
		<section className='py-[80px] md:py-[120px]'>
			<div className='mx-auto max-w-[1200px]'>
				<div className='animate-home-fade-up mx-auto max-w-[720px] text-center'>
					<div className='mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/80 px-4 py-2 text-xs text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_4%,transparent)]'>
						<BadgeIcon className='h-3.5 w-3.5' />
						{heroBadge.label}
					</div>
					<h1 className='mb-6 text-[36px] font-bold leading-tight tracking-tight md:text-[52px]'>
						Трекер задач для команд,{' '}
						<span className='text-primary'>которые ценят простоту</span>
					</h1>
					<p className='mx-auto mb-10 max-w-[600px] text-[16px] leading-relaxed text-muted-foreground md:text-[18px]'>
						Kanban-first подход, мощные фильтры, AI для планирования и всё это с лёгким
						развёртыванием на своём сервере.
					</p>
					<div className='flex flex-wrap items-center justify-center gap-4'>
						<Button size='lg' className='h-12 px-8 text-[15px]' asChild>
							<Link href={heroActions.primary.href}>
								<Play className='mr-2 h-4 w-4' />
								{heroActions.primary.label}
							</Link>
						</Button>
						<Button variant='outline' size='lg' className='h-12 px-8 text-[15px]' asChild>
							<Link href={heroActions.secondary.href}>
								<SecondaryIcon className='mr-2 h-4 w-4' />
								{heroActions.secondary.label}
							</Link>
						</Button>
					</div>
				</div>

				<div className='animate-home-fade-up-delay mt-[64px] overflow-hidden rounded-xl border border-border bg-card shadow-level-3'>
					<div className='flex items-center gap-2 border-b border-border px-6 py-4'>
						<div className='h-3 w-3 rounded-full bg-destructive/60' />
						<div className='h-3 w-3 rounded-full bg-warning/60' />
						<div className='h-3 w-3 rounded-full bg-success/60' />
						<span className='ml-3 text-sm text-muted-foreground'>
							Sprint Board — Tracker Task
						</span>
					</div>
					<div className='p-6'>
						<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
							{boardColumns.map((column) => (
								<div key={column.title} className='rounded-lg bg-background p-4'>
									<div className='mb-4 flex items-center justify-between text-sm font-semibold text-muted-foreground'>
										{column.title}
										<span className='rounded bg-surface-2 px-2 py-0.5 text-[11px]'>
											{column.count}
										</span>
									</div>
									<div className='space-y-3'>
										{Array.from({ length: column.count }).map((_, index) => (
											<div
												key={`${column.title}-${index}`}
												className='rounded-md border border-border/50 bg-surface-2 p-4'
											>
												<div className='mb-3 h-2.5 w-3/4 rounded bg-muted-foreground/20' />
												<div className='h-2 w-1/2 rounded bg-muted-foreground/10' />
												<div className='mt-4 flex items-center gap-2'>
													<div className='h-4 w-8 rounded-sm bg-primary/20' />
													<div className='ml-auto h-5 w-5 rounded-full bg-primary/30' />
												</div>
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
