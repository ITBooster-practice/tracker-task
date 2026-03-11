'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { Button, EmptyState } from '@repo/ui'
import { Plus, Users } from '@repo/ui/icons'

import {
	teamPageHeaderClassName,
	teamPagePrimaryButtonClassName,
	teamPageSubtitleClassName,
	teamPageTitleClassName,
} from '../lib/styles'
import { useTeamsStore } from '../model/store'
import type { TeamCardModel } from '../model/types'
import { TeamCard } from './team-card'

function TeamsPageView() {
	const router = useRouter()
	const teams = useTeamsStore((state) => state.teams)

	const sortedTeams = useMemo(
		() =>
			[...teams].sort((first, second) => second.members.length - first.members.length),
		[teams],
	)

	const handleOpenTeam = (team: TeamCardModel) => {
		router.push(`/projects?team=${encodeURIComponent(team.id)}`)
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
						onClick={() => router.push('/teams/new')}
						className={teamPagePrimaryButtonClassName}
					>
						<Plus className='mr-2 size-4' />
						Создать команду
					</Button>
				</header>

				{sortedTeams.length === 0 ? (
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<Users className='size-7' />}
							title='Нет команд'
							description='Создайте первую команду, чтобы начать работу.'
							action={
								<Button
									onClick={() => router.push('/teams/new')}
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
