'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@repo/ui'
import { FolderKanban, ListTodo, Rocket } from '@repo/ui/icons'

import { useSideBarStore } from '../../model/sidebar'
import { SidebarMenuItem } from './sidebar-menu-item'

const sidebarItems = [
	{
		title: 'Projects',
		href: '/projects',
		icon: <FolderKanban className='size-4' />,
	},
	{
		title: 'Tasks',
		href: '/tasks',
		icon: <ListTodo className='size-4' />,
	},
	{
		title: 'Sprints',
		href: '/sprints',
		icon: <Rocket className='size-4' />,
	},
]

const Sidebar = () => {
	const { isOpen } = useSideBarStore()
	const pathname = usePathname()

	return (
		<div
			className={cn(
				'flex h-full flex-col gap-1 overflow-hidden bg-sidebar p-2 text-sidebar-foreground transition-all duration-200',
				{
					'w-56': isOpen,
					'w-12': !isOpen,
				},
			)}
		>
			{sidebarItems.map((item) => (
				<SidebarMenuItem
					key={item.href}
					icon={item.icon}
					title={item.title}
					href={item.href}
					isOpen={isOpen}
					isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
				/>
			))}
		</div>
	)
}

export { Sidebar }
