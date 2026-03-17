'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { Button, EmptyState } from '@repo/ui'
import { Plus, Users } from '@repo/ui/icons'

import { useTeamsList } from '@/shared/api/use-teams'
import { ROUTES, teamRoutes } from '@/shared/config'

import { mapTeamListItemToTeamCardModel } from '../lib/mappers'
import {
	teamPageHeaderClassName,
	teamPagePrimaryButtonClassName,
	teamPageSubtitleClassName,
	teamPageTitleClassName,
} from '../lib/styles'
import type { TeamCardModel } from '../model/types'
import { TeamCard } from './team-card'

function TeamsPageView() {
	const router = useRouter()
	const { data, isPending, isError, refetch } = useTeamsList()

	const sortedTeams = useMemo(
		() =>
			(data ?? [])
				.map(mapTeamListItemToTeamCardModel)
				.sort((first, second) => second.members.length - first.members.length),
		[data],
	)

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

					<Button
						onClick={() => router.push(ROUTES.teamsNew)}
						className={teamPagePrimaryButtonClassName}
					>
						<Plus className='mr-2 size-4' />
						Создать команду
					</Button>
				</header>

				{isPending ? (
					<div className='flex justify-center py-16 text-sm text-muted-foreground'>
						Загрузка команд...
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
				) : sortedTeams.length === 0 ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<Users className='size-7' />}
							title='Нет команд'
							description='Создайте первую команду, чтобы начать работу.'
							action={
								<Button
									onClick={() => router.push(ROUTES.teamsNew)}
									className={teamPagePrimaryButtonClassName}
								>
									<Plus className='mr-2 size-4' />
									Создать команду
								</Button>
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				) : (
					<section className='grid gap-4 sm:grid-cols-2'>
						{sortedTeams.map((team) => (
							<TeamCard key={team.id} team={team} onOpen={handleOpenTeam} />
						))}
					</section>
				)}
			</div>
		</div>
	)
}

export { TeamsPageView }
