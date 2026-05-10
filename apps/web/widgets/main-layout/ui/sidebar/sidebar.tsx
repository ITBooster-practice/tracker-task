'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import React from 'react'

import type { TeamRole } from '@repo/types'
import { Avatar, AvatarFallback, cn } from '@repo/ui'
import { KanbanSquare } from '@repo/ui/icons'

import { useMe } from '@/shared/api/use-auth'
import { useProjectsList } from '@/shared/api/use-projects'
import { useTeamsList } from '@/shared/api/use-teams'
import {
	getSidebarRouteId,
	ROUTES,
	teamRoutes,
	type SidebarRouteId,
} from '@/shared/config'
import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

import {
	getSidebarSections,
	sidebarCurrentUser,
	sidebarWorkspace,
	useSideBarStore,
} from '../../model/sidebar'
import { SidebarMenuItem } from './sidebar-menu-item'
import { SidebarSelector } from './sidebar-selector'

interface Props {
	className?: string
	forceOpen?: boolean
	onNavigate?: () => void
}

const ROLE_LABELS: Record<TeamRole, string> = {
	OWNER: 'Владелец',
	ADMIN: 'Администратор',
	MEMBER: 'Участник',
}

const ROLE_BADGE_CLASS: Record<TeamRole, string> = {
	OWNER: 'bg-amber-500/20 text-amber-400',
	ADMIN: 'bg-blue-500/20 text-blue-400',
	MEMBER: 'bg-sidebar-accent text-sidebar-foreground/60',
}

function getShortName(name: string) {
	return name.slice(0, 2).toUpperCase()
}

const Sidebar = ({ className, forceOpen, onNavigate }: Props) => {
	const router = useRouter()
	const { isOpen: isDesktopOpen } = useSideBarStore()
	const pathname = usePathname()
	const params = useParams<{ id?: string; projectId?: string }>()
	const profileQuery = useMe()
	const { data: teamsData } = useTeamsList({ page: 1, limit: 50 })
	const teams = teamsData?.data ?? []
	const isOpen = forceOpen ?? isDesktopOpen

	const selectedTeamId = typeof params.id === 'string' ? params.id : null
	const teamId = selectedTeamId ?? teams[0]?.id ?? null
	const currentTeam = teams.find((t) => t.id === teamId) ?? null

	const { data: projectsData } = useProjectsList(teamId ?? '')
	const projects = projectsData?.data ?? []

	const projectId = typeof params.projectId === 'string' ? params.projectId : null
	const currentProject = projects.find((p) => p.id === projectId) ?? null

	const currentUserRole = currentTeam?.currentUserRole ?? null
	const currentUserName = profileQuery.data
		? getUserDisplayName(profileQuery.data)
		: sidebarCurrentUser.name
	const currentUserInitials =
		getNameInitials(currentUserName) || sidebarCurrentUser.initials

	const activeRouteId = getSidebarRouteId(pathname)
	const sections = getSidebarSections(teamId, projectId)
	const collapsedItems = sections.flatMap((section) => section.items)

	const teamOptions = teams.map((t) => ({
		id: t.id,
		name: t.name,
		shortName: getShortName(t.name),
	}))

	const projectOptions = projects.map((p) => ({
		id: p.id,
		name: p.name,
		shortName: getShortName(p.name),
	}))

	const handleSelectTeam = (id: string) => {
		router.push(teamRoutes.projects(id))
		onNavigate?.()
	}

	const handleSelectProject = (id: string) => {
		if (!teamId) return
		router.push(teamRoutes.project(teamId, id))
		onNavigate?.()
	}

	const isItemActive = (href: string, routeId?: SidebarRouteId) => {
		if (href === '#' || !routeId || !activeRouteId) {
			return false
		}

		return routeId === activeRouteId
	}

	const teamShortValue = currentTeam ? getShortName(currentTeam.name) : '?'
	const projectShortValue = currentProject ? getShortName(currentProject.name) : '?'

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
					<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-[calc(var(--radius-control)-2px)] bg-sidebar-primary text-sidebar-primary-foreground'>
						<KanbanSquare className='size-4' />
					</div>
					{isOpen && (
						<div className='min-w-0'>
							<div className='truncate text-sm font-semibold leading-5'>
								{sidebarWorkspace.title}
							</div>
						</div>
					)}
				</Link>
			</div>

			<div className='flex flex-1 flex-col overflow-hidden'>
				<div className='flex-1 overflow-y-auto px-3 py-4'>
					{isOpen ? (
						<div className='space-y-5'>
							<div className='space-y-2'>
								<SidebarSelector
									label='Команда'
									value={currentTeam?.name ?? '—'}
									shortValue={teamShortValue}
									options={teamOptions}
									activeId={teamId}
									isOpen={isOpen}
									emptyLabel='Нет команд'
									onSelect={handleSelectTeam}
								/>
								<SidebarSelector
									label='Проект'
									value={currentProject?.name ?? '—'}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									onSelect={handleSelectProject}
								/>
							</div>

							{sections.map((section) => (
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
						<div className='space-y-4'>
							<div className='flex flex-col items-center gap-2'>
								<SidebarSelector
									label='Команда'
									value={currentTeam?.name ?? '—'}
									shortValue={teamShortValue}
									options={teamOptions}
									activeId={teamId}
									isOpen={isOpen}
									emptyLabel='Нет команд'
									onSelect={handleSelectTeam}
								/>
								<SidebarSelector
									label='Проект'
									value={currentProject?.name ?? '—'}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									onSelect={handleSelectProject}
								/>
							</div>

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
						</div>
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
								'flex rounded-[var(--radius-control)] text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/35',
								{
									'h-8 items-center justify-center': !isOpen,
									'min-w-0 flex-1 items-start gap-2 px-1.5 py-1': isOpen,
								},
							)}
						>
							<Avatar className='size-6 shrink-0'>
								<AvatarFallback className='bg-sidebar-primary text-xs text-sidebar-primary-foreground'>
									{currentUserInitials}
								</AvatarFallback>
							</Avatar>
							{isOpen && (
								<div className='min-w-0'>
									<div className='truncate text-[12px] font-medium leading-tight'>
										{currentUserName}
									</div>
									{currentUserRole ? (
										<span
											className={cn(
												'mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-medium',
												ROLE_BADGE_CLASS[currentUserRole],
											)}
										>
											{ROLE_LABELS[currentUserRole]}
										</span>
									) : (
										<div className='truncate text-[10px] text-muted-foreground'>
											{sidebarCurrentUser.role}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { Sidebar }
