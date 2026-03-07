import { KanbanSquare } from '@repo/ui/icons'

import { footerLinks } from '../model/content'

function HomeFooter() {
	return (
		<footer className='animate-home-fade border-t border-border py-8'>
			<div className='mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-1 md:flex-row'>
				<div className='flex items-center gap-2'>
					<KanbanSquare className='h-4 w-4 text-primary' />
					<span className='text-sm text-muted-foreground'>
						Tracker Task — open-source task tracker
					</span>
				</div>
				<div className='flex flex-wrap items-center gap-6 text-sm text-muted-foreground'>
					{footerLinks.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className='transition-colors hover:text-foreground'
							target={item.href.startsWith('http') ? '_blank' : undefined}
							rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
						>
							{item.label}
						</a>
					))}
				</div>
			</div>
		</footer>
	)
}

export { HomeFooter }
