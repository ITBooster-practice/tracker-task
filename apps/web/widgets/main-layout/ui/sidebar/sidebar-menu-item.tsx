import Link from 'next/link'
import React from 'react'

import { cn } from '@repo/ui'

interface Props {
	icon: React.ReactNode
	title: string
	href: string
	isOpen: boolean
	isActive?: boolean
	onNavigate?: () => void
}

const SidebarMenuItem = (props: Props) => {
	const { href, title, icon, isOpen, isActive = false, onNavigate } = props

	const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (href === '#') {
			event.preventDefault()
		}

		onNavigate?.()
	}

	return (
		<Link
			href={href}
			title={!isOpen ? title : undefined}
			onClick={handleClick}
			className={cn(
				'flex h-9 items-center rounded-md px-2 text-sm transition-colors justify-start gap-2',
				{
					'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
					'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground':
						!isActive,
				},
			)}
		>
			<span className='shrink-0'>{icon}</span>
			{isOpen && <span className='truncate'>{title}</span>}
		</Link>
	)
}

export { SidebarMenuItem }
