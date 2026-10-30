'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import React from 'react'

import { FEATURE_KEYS } from '@repo/types'
import { cn } from '@repo/ui'
import { KanbanSquare } from '@repo/ui/icons'

import { useProjectsList } from '@/shared/api/use-projects'
import { useTeamsList } from '@/shared/api/use-teams'
import {
	getSidebarRouteId,
	ROUTES,
	teamRoutes,
	type SidebarRouteId,
} from '@/shared/config'
import { useFeatureFlags } from '@/shared/lib/feature-flags/context'
import { hasFeature } from '@/shared/lib/feature-flags/feature-flags'

import {
	getSidebarSections,
	sidebarWorkspace,
	useSideBarStore,
} from '../../model/sidebar'
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
	const params = useParams<{ id?: string; projectId?: string }>()
	const flags = useFeatureFlags()
	const snapshot = flags.status === 'ready' ? flags.snapshot : null
	const projectsEnabled = hasFeature(snapshot, FEATURE_KEYS.PROJECTS)
	const { data: teamsData } = useTeamsList({ page: 1, limit: 50 })
	const teams = teamsData?.data ?? []
	const isOpen = forceOpen ?? isDesktopOpen

	const teamId = typeof params.id === 'string' ? params.id : null
	const currentTeam = teams.find((t) => t.id === teamId) ?? null

	const { data: projectsData } = useProjectsList(projectsEnabled ? (teamId ?? '') : '')
	const projects = projectsEnabled ? (projectsData?.data ?? []) : []

	const projectId = typeof params.projectId === 'string' ? params.projectId : null
	const currentProject =
		projects.find((p) => p.id === projectId && p.teamId === teamId) ?? null

	const activeRouteId = getSidebarRouteId(pathname)
	const sections = getSidebarSections(teamId, projectId, snapshot, flags.canManage)
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
			<div className='h-14 px-3'>
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
									value={currentProject?.name ?? ''}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									placeholder='Выберите проект'
									disabled={!teamId || !projectsEnabled}
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
									value={currentProject?.name ?? ''}
									shortValue={projectShortValue}
									options={projectOptions}
									activeId={projectId}
									isOpen={isOpen}
									emptyLabel='Нет проектов'
									placeholder='Выберите проект'
									disabled={!teamId || !projectsEnabled}
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

				<SidebarUser
					teamId={teamId}
					projectId={projectId}
					projectsEnabled={projectsEnabled}
					isOpen={isOpen}
				/>
			</div>
		</div>
	)
}

export { Sidebar }
