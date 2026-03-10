import Link from 'next/link'
import React from 'react'

import { cn } from '@repo/ui'

import type { SidebarNavItem } from '../../model/sidebar'

interface Props extends SidebarNavItem {
	isOpen: boolean
	isActive?: boolean
	onNavigate?: () => void
}

const SidebarMenuItem = (props: Props) => {
	const {
		href,
		title,
		icon: Icon,
		iconClassName,
		isOpen,
		isActive = false,
		onNavigate,
	} = props

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
			className={cn('flex items-center text-[14px] transition-colors', {
				'h-10 justify-center rounded-lg': !isOpen,
				'h-10 justify-start gap-3 rounded-[16px] px-3.5': isOpen,
				'bg-sidebar-accent/80 font-medium text-sidebar-primary': isActive,
				'text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground':
					!isActive,
			})}
		>
			<Icon
				className={cn(
					'size-4 shrink-0',
					isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/90',
					iconClassName,
				)}
			/>
			{isOpen && <span className='truncate'>{title}</span>}
		</Link>
	)
}

export { SidebarMenuItem }
