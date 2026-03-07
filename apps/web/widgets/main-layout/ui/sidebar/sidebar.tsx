'use client'

import { ThemeToggle } from '@/features/theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { Avatar, AvatarFallback, cn } from '@repo/ui'
import { FolderKanban, ListTodo, Rocket, Settings } from '@repo/ui/icons'

import { useSideBarStore } from '../../model/sidebar'
import { SidebarMenuItem } from './sidebar-menu-item'

const sidebarItems = [
	{
		title: 'Проекты',
		href: '/projects',
		icon: <FolderKanban className='size-4' />,
	},
	{
		title: 'Задачи',
		href: '/tasks',
		icon: <ListTodo className='size-4' />,
	},
	{
		title: 'Спринты',
		href: '/sprints',
		icon: <Rocket className='size-4' />,
	},
	{
		title: 'Настройки',
		href: '#',
		icon: <Settings className='size-4' />,
	},
]

interface Props {
	className?: string
	forceOpen?: boolean
	onNavigate?: () => void
}

const Sidebar = ({ className, forceOpen, onNavigate }: Props) => {
	const { isOpen: isDesktopOpen } = useSideBarStore()
	const pathname = usePathname()
	const isOpen = forceOpen ?? isDesktopOpen

	return (
		<div
			className={cn(
				'flex h-full flex-col gap-1 overflow-hidden bg-sidebar p-2 text-sidebar-foreground transition-all duration-200',
				{
					'w-56': isOpen,
					'w-12': !isOpen,
				},
				className,
			)}
		>
			<Link
				href='/'
				onClick={onNavigate}
				className='mb-2 flex h-9 items-center gap-2 rounded-md px-2 transition-colors hover:bg-sidebar-accent/50'
			>
				<div className='flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground'>
					TT
				</div>
				{isOpen && <span className='truncate text-sm font-semibold'>Tracker Task</span>}
			</Link>

			<nav className='flex flex-1 flex-col gap-1'>
				{sidebarItems.map((item) => (
					<SidebarMenuItem
						key={item.title}
						icon={item.icon}
						title={item.title}
						href={item.href}
						isOpen={isOpen}
						isActive={
							item.href !== '#' &&
							(pathname === item.href || pathname.startsWith(`${item.href}/`))
						}
						onNavigate={onNavigate}
					/>
				))}
			</nav>

			<div className='mt-auto border-t border-sidebar-border pt-2'>
				<div
					className={cn('mb-4 flex items-center', {
						'justify-start px-2': isOpen,
						'justify-center': !isOpen,
					})}
				>
					<ThemeToggle />
				</div>

				<div
					className={cn(
						'flex h-9 items-center rounded-md bg-sidebar-accent/50 text-sidebar-accent-foreground',
						{
							'justify-start gap-2 px-2': isOpen,
							'justify-center': !isOpen,
						},
					)}
				>
					<Avatar size='sm'>
						<AvatarFallback>AL</AvatarFallback>
					</Avatar>
					{isOpen && <span className='truncate text-sm font-medium'>Alex</span>}
				</div>
			</div>
		</div>
	)
}

export { Sidebar }
