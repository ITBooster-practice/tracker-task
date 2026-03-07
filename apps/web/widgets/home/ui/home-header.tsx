import Link from 'next/link'

import { navigationItems } from '../model/content'

function HomeHeader() {
	return (
		<header className='sticky top-0 z-20 rounded-xl border border-border/70 bg-background/80 px-4 py-3 backdrop-blur sm:px-5'>
			<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/12 text-sm font-semibold text-primary'>
						TT
					</div>
					<div>
						<p className='text-sm font-medium tracking-[0.24em] text-primary/90'>
							TRACKER TASK
						</p>
						<p className='text-sm text-muted-foreground'>
							Open-source task tracker for product teams
						</p>
					</div>
				</div>

				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end'>
					<nav className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
						{navigationItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className='rounded-full px-3 py-2 transition-colors hover:bg-card hover:text-foreground'
							>
								{item.label}
							</Link>
						))}
					</nav>

					<div className='flex items-center gap-2'>
						<Link
							href='/login'
							className='inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
						>
							Войти
						</Link>
					</div>
				</div>
			</div>
		</header>
	)
}

export { HomeHeader }
