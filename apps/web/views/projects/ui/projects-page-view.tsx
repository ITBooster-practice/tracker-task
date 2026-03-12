'use client'

import { useTeamDetail } from '@/hooks/api/use-teams'
import {
	buildTeamProjectHref,
	createProjectId,
	projectCatalog,
	type ProjectCatalogItem,
} from '@/lib/projects/catalog'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, EmptyState, Input } from '@repo/ui'
import { FolderKanban, Plus, Search } from '@repo/ui/icons'

import {
	projectPageHeaderClassName,
	projectPagePrimaryButtonClassName,
	projectPageSubtitleClassName,
	projectPageTitleClassName,
} from '../lib/styles'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectCard } from './project-card'

function ProjectsPageView() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const teamId = decodeURIComponent(params.id)
	const { data: team } = useTeamDetail(teamId)
	const [searchQuery, setSearchQuery] = useState('')
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [projects, setProjects] = useState<ProjectCatalogItem[]>(projectCatalog)

	const normalizedQuery = searchQuery.trim().toLowerCase()
	const filteredProjects = projects.filter((project) => {
		if (!normalizedQuery) {
			return true
		}

		return [project.name, project.description, project.code].some((value) =>
			value.toLowerCase().includes(normalizedQuery),
		)
	})

	const handleOpenProject = (project: ProjectCatalogItem) => {
		router.push(buildTeamProjectHref(teamId, project.id))
	}

	const handleCreateProject = ({ name, code }: { name: string; code: string }) => {
		const nextProject: ProjectCatalogItem = {
			id: createProjectId(
				name,
				projects.map((project) => project.id),
			),
			code,
			name,
			description: 'Новый проект команды',
			boardsCount: 0,
			tasksCount: 0,
		}

		setProjects((currentProjects) => [nextProject, ...currentProjects])
		setIsCreateDialogOpen(false)
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={projectPageHeaderClassName}>
					<div>
						<h1 className={projectPageTitleClassName}>Проекты</h1>
						<p className={projectPageSubtitleClassName}>
							{team?.name ?? 'Загрузка команды'}
						</p>
					</div>

					<Button
						onClick={() => setIsCreateDialogOpen(true)}
						className={projectPagePrimaryButtonClassName}
					>
						<Plus className='mr-2 size-4' />
						Создать проект
					</Button>
				</header>

				<div className='relative mb-5 max-w-[420px]'>
					<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder='Поиск проектов...'
						className='h-10 rounded-[14px] border-border bg-background pl-9 text-[14px] shadow-none focus-visible:ring-[3px]'
					/>
				</div>

				{filteredProjects.length === 0 ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<FolderKanban className='size-7' />}
							title='Проекты не найдены'
							description='Измените запрос или создайте новый проект.'
							action={
								<Button
									onClick={() => setIsCreateDialogOpen(true)}
									className={projectPagePrimaryButtonClassName}
								>
									<Plus className='mr-2 size-4' />
									Создать проект
								</Button>
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : (
					<section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{filteredProjects.map((project) => (
							<ProjectCard
								key={project.id}
								project={project}
								onOpen={handleOpenProject}
							/>
						))}
					</section>
				)}

				<CreateProjectDialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
					onCreate={handleCreateProject}
				/>
			</div>
		</div>
	)
}

export { ProjectsPageView }
