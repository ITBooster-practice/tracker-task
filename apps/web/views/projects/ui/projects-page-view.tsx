'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Project } from '@repo/types'
import { Button, CardSkeleton, EmptyState, Input, Pagination } from '@repo/ui'
import { FolderKanban, Plus, Search } from '@repo/ui/icons'

import { teamRoutes } from '@/shared/config'
import { ViewToggle, type ViewMode } from '@/shared/ui/view-toggle'

import {
	projectPageHeaderClassName,
	projectPagePrimaryButtonClassName,
	projectPageSubtitleClassName,
	projectPageTitleClassName,
} from '../lib/styles'
import { useProjectsPage } from '../model/use-projects-page'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectCard } from './project-card'
import { ProjectListItem } from './project-list-item'

const SKELETON_COUNT = 6

function ProjectsPageView() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const teamId = decodeURIComponent(params.id)
	const {
		teamName,
		allProjects,
		filteredProjects,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery,
		refetch,
		meta,
		setPage,
	} = useProjectsPage(teamId)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [viewMode, setViewMode] = useState<ViewMode>('list')

	const handleOpenProject = (project: Project) => {
		router.push(teamRoutes.project(teamId, project.id))
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={projectPageHeaderClassName}>
					<div>
						<h1 className={projectPageTitleClassName}>Проекты</h1>
						<p className={projectPageSubtitleClassName}>
							{teamName ?? 'Загрузка команды'}
						</p>
					</div>

					<div className='self-end'>
						<Button
							onClick={() => setIsCreateDialogOpen(true)}
							className={projectPagePrimaryButtonClassName}
						>
							<Plus className='size-4' />
							Создать проект
						</Button>
					</div>
				</header>

				<div className='mb-5 flex items-center gap-3'>
					<div className='relative max-w-[360px] flex-1'>
						<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder='Поиск проектов...'
							className='h-10 rounded-[var(--radius-control)] border-border bg-background pl-9 text-[14px] shadow-none focus-visible:ring-[3px]'
						/>
					</div>
					<ViewToggle view={viewMode} onChange={setViewMode} />
				</div>

				{isLoading ? (
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: SKELETON_COUNT }).map((_, index) => (
							<CardSkeleton key={`project-skeleton-${index}`} />
						))}
					</div>
				) : isError ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<FolderKanban className='size-7' />}
							title='Не удалось загрузить проекты'
							description='Попробуйте повторить запрос ещё раз.'
							action={
								<Button
									onClick={() => void refetch()}
									className={projectPagePrimaryButtonClassName}
								>
									Повторить
								</Button>
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : filteredProjects.length === 0 ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<FolderKanban className='size-7' />}
							title={
								allProjects.length === 0
									? 'У команды ещё нет проектов'
									: 'Проекты не найдены'
							}
							description={
								allProjects.length === 0
									? 'Создайте первый проект, чтобы начать работу.'
									: 'Измените запрос или создайте новый проект.'
							}
							action={
								allProjects.length === 0 ? (
									<Button
										onClick={() => setIsCreateDialogOpen(true)}
										className={projectPagePrimaryButtonClassName}
									>
										<Plus className='size-4' />
										Создать
									</Button>
								) : undefined
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : viewMode === 'list' ? (
					<>
						<section className='space-y-3'>
							{filteredProjects.map((project) => (
								<ProjectListItem
									key={project.id}
									project={project}
									onOpen={handleOpenProject}
								/>
							))}
						</section>

						{meta && meta.totalPages > 1 && (
							<Pagination meta={meta} onPageChange={setPage} className='mt-6' />
						)}
					</>
				) : (
					<>
						<section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							{filteredProjects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									onOpen={handleOpenProject}
								/>
							))}
						</section>

						{meta && meta.totalPages > 1 && (
							<Pagination meta={meta} onPageChange={setPage} className='mt-6' />
						)}
					</>
				)}

				<CreateProjectDialog
					teamId={teamId}
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
				/>
			</div>
		</div>
	)
}

export { ProjectsPageView }
