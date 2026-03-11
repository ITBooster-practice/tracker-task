import React from 'react'

import { cn } from '@repo/ui'

import type { SidebarProjectItem as SidebarProjectItemType } from '../../model/sidebar'

interface Props extends SidebarProjectItemType {
	isOpen: boolean
}

function SidebarProjectItem({ shortName, title, isOpen }: Props) {
	if (!isOpen) {
		return null
	}

	return (
		<div
			className={cn(
				'flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground/90 transition-colors',
				'hover:bg-sidebar-accent/45',
			)}
		>
			<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-muted-foreground'>
				{shortName}
			</div>
			<span className='truncate'>{title}</span>
		</div>
	)
}

export { SidebarProjectItem }
