import Link from 'next/link'

import { cn } from '@repo/ui'

import type { SidebarProjectItem as SidebarProjectItemType } from '../../model/sidebar'

interface Props extends SidebarProjectItemType {
	href: string
	isActive: boolean
	isOpen: boolean
	onNavigate?: () => void
}

function SidebarProjectItem({
	shortName,
	title,
	href,
	isActive,
	isOpen,
	onNavigate,
}: Props) {
	if (!isOpen) {
		return null
	}

	return (
		<Link
			href={href}
			onClick={onNavigate}
			className={cn(
				'flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground/90 transition-colors',
				'hover:bg-sidebar-accent/45',
				isActive && 'bg-sidebar-accent/55 text-sidebar-accent-foreground',
			)}
		>
			<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-muted-foreground'>
				{shortName}
			</div>
			<span className='truncate'>{title}</span>
		</Link>
	)
}

export { SidebarProjectItem }
