'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

import { cn } from '@repo/ui'
import { KanbanSquare } from '@repo/ui/icons'

import {
	getSidebarRouteId,
	ROUTES,
	teamRoutes,
	type SidebarRouteId,
} from '@/shared/config'
import { useFeatureFlags } from '@/shared/lib/feature-flags/context'

import {
	getSidebarSections,
	sidebarWorkspace,
	useSideBarStore,
} from '../../model/sidebar'
import { useWorkspaceContext } from '../../model/use-workspace-context'
import { SidebarMenuItem } from './sidebar-menu-item'
import { SidebarSelector } from './sidebar-selector'
import { SidebarUser } from './sidebar-user'

interface Props {
	className?: string
	forceOpen?: boolean
	onNavigate?: () => void
}

function getShortName(name: string) {
	return name.slice(0, 2).toUpperCase()
}

const Sidebar = ({ className, forceOpen, onNavigate }: Props) => {
	const router = useRouter()
	const { isOpen: isDesktopOpen } = useSideBarStore()
	const pathname = usePathname()
	const flags = useFeatureFlags()
	const snapshot = flags.status === 'ready' ? flags.snapshot : null
	const isOpen = forceOpen ?? isDesktopOpen
	const {
		teamId,
		projectId,
		currentTeam,
		currentProject,
		teams,
		projects,
		teamsLoading,
		projectsLoading,
		canManageTeam,
		selectTeam,
		selectProject,
	} = useWorkspaceContext()

	const activeRouteId = getSidebarRouteId(pathname)
	const sections = getSidebarSections(
		teamId,
		projectId,
		snapshot,
		flags.canManage,
		canManageTeam,
	)
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
		if (!teams.some((team) => team.id === id)) return
		selectTeam(id)
		router.push(teamRoutes.projects(id))
		onNavigate?.()
	}

	const handleSelectProject = (id: string) => {
		if (
			!teamId ||
			!projects.some((project) => project.id === id && project.teamId === teamId)
		)
			return
		selectProject(id)
		router.push(teamRoutes.project(teamId, id))
		onNavigate?.()
	}

	const isItemActive = (href: string | undefined, routeId?: SidebarRouteId) => {
		if (!href || !routeId || !activeRouteId) {
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
			<div className={cn('h-14', isOpen ? 'px-3' : 'px-1.5')}>
				<Link
					href={ROUTES.home}
					aria-label={sidebarWorkspace.title}
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
				<div
					className={cn(
						'flex-1 overflow-y-auto py-4',
						isOpen
							? 'px-3'
							: 'px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
					)}
				>
					{isOpen ? (
						<div className='space-y-5'>
							<div className='space-y-2'>
								<SidebarSelector
									label='Команда'
									loading={teamsLoading}
									value={currentTeam?.name ?? ''}
									shortValue={teamShortValue}
									options={teamOptions}
									activeId={teamId}
									isOpen={isOpen}
									emptyLabel='Нет команд'
									placeholder='Выберите команду'
									onSelect={handleSelectTeam}
								/>
								<SidebarSelector
									label='Проект'
									loading={projectsLoading}
									value={currentProject?.name ?? ''}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									placeholder='Выберите проект'
									disabled={!teamId}
									disabledReason={!teamId ? 'Сначала выберите команду' : undefined}
									onSelect={handleSelectProject}
								/>
							</div>

							{sections
								.filter((section) => section.items.length > 0)
								.map((section) => (
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
									loading={teamsLoading}
									value={currentTeam?.name ?? ''}
									shortValue={teamShortValue}
									options={teamOptions}
									activeId={teamId}
									isOpen={isOpen}
									emptyLabel='Нет команд'
									placeholder='Выберите команду'
									onSelect={handleSelectTeam}
								/>
								<SidebarSelector
									label='Проект'
									loading={projectsLoading}
									value={currentProject?.name ?? ''}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									placeholder='Выберите проект'
									disabled={!teamId}
									disabledReason={!teamId ? 'Сначала выберите команду' : undefined}
									onSelect={handleSelectProject}
								/>
							</div>

							<nav className='space-y-2'>
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

				<SidebarUser
					teamId={teamId}
					projectId={projectId}
					isOpen={isOpen}
					onNavigate={onNavigate}
				/>
			</div>
		</div>
	)
}

export { Sidebar }
