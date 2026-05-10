'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, CardSkeleton, EmptyState, Input, Pagination } from '@repo/ui'
import { Plus, Search, Users } from '@repo/ui/icons'

import { ROUTES, teamRoutes } from '@/shared/config'
import { ViewToggle, type ViewMode } from '@/shared/ui/view-toggle'

import {
	teamPageGridClassName,
	teamPageHeaderClassName,
	teamPagePrimaryButtonClassName,
	teamPageSubtitleClassName,
	teamPageTitleClassName,
} from '../lib/styles'
import type { TeamCardModel } from '../model/types'
import { useTeamsPage } from '../model/use-teams-page'
import { TeamCard } from './team-card'
import { TeamListItem } from './team-list-item'

function TeamsPageView() {
	const router = useRouter()
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const {
		allTeams,
		filteredTeams,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery,
		refetch,
		meta,
		setPage,
	} = useTeamsPage()

	const handleOpenTeam = (team: TeamCardModel) => {
		router.push(teamRoutes.projects(team.id))
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={teamPageHeaderClassName}>
					<div>
						<h1 className={teamPageTitleClassName}>Команды</h1>
						<p className={teamPageSubtitleClassName}>
							Выберите команду или создайте новую
						</p>
					</div>

					<div className='self-end'>
						<Button
							onClick={() => router.push(ROUTES.teamsNew)}
							className={teamPagePrimaryButtonClassName}
						>
							<Plus className='size-4' />
							Создать команду
						</Button>
					</div>
				</header>

				<div className='mb-5 flex items-center gap-3'>
					<div className='relative max-w-[360px] flex-1'>
						<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Найти команду...'
							className='h-10 rounded-[var(--radius-control)] border-border bg-background pl-9 text-[14px] shadow-none focus-visible:ring-[3px]'
						/>
					</div>
					<ViewToggle view={viewMode} onChange={setViewMode} />
				</div>

				{isLoading ? (
					<div className={teamPageGridClassName} data-testid='teams-page-skeleton'>
						{Array.from({ length: 4 }).map((_, index) => (
							<CardSkeleton key={`teams-skeleton-${index}`} />
						))}
					</div>
				) : isError ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<Users className='size-7' />}
							title='Не удалось загрузить команды'
							description='Попробуйте повторить запрос ещё раз.'
							action={
								<Button
									onClick={() => void refetch()}
									className={teamPagePrimaryButtonClassName}
								>
									Повторить
								</Button>
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : filteredTeams.length === 0 ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<Users className='size-7' />}
							title={allTeams.length === 0 ? 'Нет команд' : 'Команды не найдены'}
							description={
								allTeams.length === 0
									? 'Создайте первую команду, чтобы начать работу.'
									: 'Измените запрос или создайте новую команду.'
							}
							action={
								allTeams.length === 0 ? (
									<Button
										onClick={() => router.push(ROUTES.teamsNew)}
										className={teamPagePrimaryButtonClassName}
									>
										<Plus className='size-4' />
										Создать команду
									</Button>
								) : undefined
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : viewMode === 'list' ? (
					<>
						<section className='space-y-3'>
							{filteredTeams.map((team) => (
								<TeamListItem key={team.id} team={team} onOpen={handleOpenTeam} />
							))}
						</section>

						{meta && meta.totalPages > 1 && (
							<Pagination meta={meta} onPageChange={setPage} className='mt-6' />
						)}
					</>
				) : (
					<>
						<section className={teamPageGridClassName}>
							{filteredTeams.map((team) => (
								<TeamCard key={team.id} team={team} onOpen={handleOpenTeam} />
							))}
						</section>

						{meta && meta.totalPages > 1 && (
							<Pagination meta={meta} onPageChange={setPage} className='mt-6' />
						)}
					</>
				)}
			</div>
		</div>
	)
}

export { TeamsPageView }
