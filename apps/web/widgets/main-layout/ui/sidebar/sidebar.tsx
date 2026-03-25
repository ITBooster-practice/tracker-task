'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import React from 'react'

import type { TeamRole } from '@repo/types'
import { Avatar, AvatarFallback, cn } from '@repo/ui'
import { KanbanSquare } from '@repo/ui/icons'

import { ThemeToggle } from '@/features/theme'
import { useTeamsList } from '@/shared/api/use-teams'
import { getSidebarRouteId, ROUTES, type SidebarRouteId } from '@/shared/config'
import { buildTeamProjectHref } from '@/shared/lib/projects'

import {
	getSidebarSections,
	sidebarCurrentUser,
	sidebarProjects,
	sidebarWorkspace,
	useSideBarStore,
} from '../../model/sidebar'
import { SidebarMenuItem } from './sidebar-menu-item'
import { SidebarProjectItem } from './sidebar-project-item'

interface Props {
	className?: string
	forceOpen?: boolean
	onNavigate?: () => void
}

function formatSidebarUserRole(role: TeamRole) {
	return role.slice(0, 1) + role.slice(1).toLowerCase()
}

const Sidebar = ({ className, forceOpen, onNavigate }: Props) => {
	const { isOpen: isDesktopOpen } = useSideBarStore()
	const pathname = usePathname()
	const params = useParams<{ id?: string; projectId?: string }>()
	const { data: teams } = useTeamsList()
	const isOpen = forceOpen ?? isDesktopOpen
	const selectedTeamId = typeof params.id === 'string' ? params.id : null
	const teamId = selectedTeamId ?? teams?.[0]?.id ?? null
	const projectId = typeof params.projectId === 'string' ? params.projectId : null
	const currentTeam = selectedTeamId
		? (teams?.find((team) => team.id === selectedTeamId) ?? null)
		: null
	const currentUserRole = currentTeam?.currentUserRole
		? formatSidebarUserRole(currentTeam.currentUserRole)
		: sidebarCurrentUser.role
	const activeRouteId = getSidebarRouteId(pathname)
	const sections = getSidebarSections(teamId)
	const [workSection, ...otherSections] = sections
	const collapsedItems = sections.flatMap((section) => section.items)

	const isItemActive = (href: string, routeId?: SidebarRouteId) => {
		if (href === '#' || !routeId || !activeRouteId) {
			return false
		}

		return routeId === activeRouteId
	}

	return (
		<div
			className={cn(
				'flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-200',
				{
					'w-56': isOpen,
					'w-12': !isOpen,
				},
				className,
			)}
		>
			<div className='h-14 border-b border-sidebar-border px-3'>
				<Link
					href={ROUTES.home}
					onClick={onNavigate}
					className={cn(
						'flex h-full items-center transition-colors hover:text-sidebar-accent-foreground',
						{
							'justify-center': !isOpen,
							'gap-3': isOpen,
						},
					)}
				>
					<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
						<KanbanSquare className='size-4' />
					</div>
					{isOpen && (
						<div className='min-w-0'>
							<div className='truncate text-sm font-semibold leading-5'>
								{sidebarWorkspace.title}
							</div>
							{currentTeam?.name ? (
								<div className='truncate text-xs text-muted-foreground'>
									{currentTeam.name}
								</div>
							) : null}
						</div>
					)}
				</Link>
			</div>

			<div className='flex flex-1 flex-col overflow-hidden'>
				<div className='flex-1 overflow-y-auto px-3 py-4'>
					{isOpen && workSection ? (
						<div className='space-y-5'>
							<section>
								<div className='mb-2 px-3 text-[12px] font-normal text-sidebar-foreground/48'>
									{workSection.title}
								</div>
								<nav className='space-y-1'>
									{workSection.items.map((item) => (
										<SidebarMenuItem
											key={item.title}
											{...item}
											isOpen={isOpen}
											isActive={isItemActive(item.href, item.routeId)}
											onNavigate={onNavigate}
										/>
									))}
								</nav>
							</section>

							<section>
								<div className='mb-2 px-3 text-[12px] font-normal text-sidebar-foreground/48'>
									Проекты
								</div>
								<div className='space-y-1'>
									{sidebarProjects.map((project) => (
										<SidebarProjectItem
											key={project.id}
											{...project}
											href={buildTeamProjectHref(teamId, project.id)}
											isActive={projectId === project.id}
											isOpen={isOpen}
											onNavigate={onNavigate}
										/>
									))}
								</div>
							</section>

							{otherSections.map((section) => (
								<section key={section.title}>
									<div className='mb-2 px-3 text-[12px] font-normal text-sidebar-foreground/48'>
										{section.title}
									</div>
									<nav className='space-y-1'>
										{section.items.map((item) => (
											<SidebarMenuItem
												key={`${section.title}-${item.title}`}
												{...item}
												isOpen={isOpen}
												isActive={isItemActive(item.href, item.routeId)}
												onNavigate={onNavigate}
											/>
										))}
									</nav>
								</section>
							))}
						</div>
					) : (
						<nav className='space-y-1'>
							{collapsedItems.map((item) => (
								<SidebarMenuItem
									key={item.title}
									{...item}
									isOpen={isOpen}
									isActive={isItemActive(item.href, item.routeId)}
									onNavigate={onNavigate}
								/>
							))}
						</nav>
					)}
				</div>

				<div className='mt-auto border-t border-sidebar-border px-3 py-3'>
					<div
						className={cn('flex items-center', {
							'justify-center': !isOpen,
							'gap-2': isOpen,
						})}
					>
						<div
							className={cn(
								'flex rounded-xl text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/35',
								{
									'h-8 items-center justify-center': !isOpen,
									'min-w-0 flex-1 items-center gap-2 px-1.5 py-1': isOpen,
								},
							)}
						>
							<Avatar className='size-6'>
								<AvatarFallback className='bg-sidebar-primary text-xs text-sidebar-primary-foreground'>
									{sidebarCurrentUser.initials}
								</AvatarFallback>
							</Avatar>
							{isOpen && (
								<div className='min-w-0'>
									<div className='truncate text-[12px] font-medium leading-tight'>
										{sidebarCurrentUser.name}
									</div>
									<div className='truncate text-[10px] text-muted-foreground'>
										{currentUserRole}
									</div>
								</div>
							)}
						</div>

						{isOpen && (
							<ThemeToggle
								size='icon-sm'
								iconClassName='size-4'
								className='shrink-0 border-sidebar-border bg-sidebar-accent/35 hover:bg-sidebar-accent/55'
							/>
						)}
						{!isOpen && <ThemeToggle size='icon-sm' iconClassName='size-4' />}
					</div>
				</div>
			</div>
		</div>
	)
}

export { Sidebar }
