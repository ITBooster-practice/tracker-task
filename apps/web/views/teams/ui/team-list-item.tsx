'use client'

import type { TeamRole } from '@repo/types'
import { cn } from '@repo/ui'
import { ChevronRight, FolderKanban, Users } from '@repo/ui/icons'

import type { TeamCardModel } from '../model/types'

const ROLE_LABEL: Record<TeamRole, string> = {
	OWNER: 'Owner',
	ADMIN: 'Admin',
	MEMBER: 'Member',
}

const ROLE_CLASS: Record<TeamRole, string> = {
	OWNER: 'text-primary',
	ADMIN: 'text-primary',
	MEMBER: 'text-muted-foreground',
}

interface Props {
	team: TeamCardModel
	onOpen: (team: TeamCardModel) => void
}

function TeamListItem({ team, onOpen }: Props) {
	return (
		<button
			type='button'
			onClick={() => onOpen(team)}
			className={cn(
				'group flex w-full cursor-pointer items-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card px-5 py-4 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
			)}
		>
			<div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
				<Users className='size-5' />
			</div>

			<div className='min-w-0 flex-1'>
				<div className='text-[15px] font-semibold leading-tight text-card-foreground'>
					{team.name}
				</div>
				<div className='mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-muted-foreground'>
					<span>{team.members.length} участников</span>
					<span className='inline-flex items-center gap-1'>
						<FolderKanban className='size-3.5' />
						{team.projectCount} проектов
					</span>
					{team.role && (
						<span className={ROLE_CLASS[team.role]}>{ROLE_LABEL[team.role]}</span>
					)}
				</div>
			</div>

			<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
		</button>
	)
}

export { TeamListItem }
