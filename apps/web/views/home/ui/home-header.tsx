import { ROUTES } from '@/shared/config/routes'
import Link from 'next/link'

import { Button } from '@repo/ui'
import { Github, KanbanSquare } from '@repo/ui/icons'

import { navigationItems } from '../model/content'

function HomeHeader() {
	return (
		<header className='animate-home-fade border-b border-border'>
			<div className='mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6'>
				<div className='flex items-center gap-2'>
					<div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
						<KanbanSquare className='h-4 w-4' />
					</div>
					<span className='text-base font-bold tracking-tight'>Tracker Task</span>
				</div>

				<nav className='hidden items-center gap-6 md:flex lg:gap-8'>
					{navigationItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className='text-sm text-muted-foreground transition-colors hover:text-foreground'
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className='flex items-center gap-2'>
					<Button variant='ghost' size='sm' className='h-9 px-3 text-sm' asChild>
						<a
							href='https://github.com/ITBooster-practice/tracker-task'
							target='_blank'
							rel='noopener noreferrer'
						>
							<Github className='mr-2 h-4 w-4' />
							GitHub
						</a>
					</Button>
					<Button size='sm' className='h-9 px-4 text-sm font-medium' asChild>
						<Link href={ROUTES.login}>Войти</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}

export { HomeHeader }
