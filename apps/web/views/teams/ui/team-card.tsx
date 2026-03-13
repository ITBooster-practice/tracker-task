'use client'

import { Avatar, AvatarFallback, cn } from '@repo/ui'
import { ArrowRight, FolderKanban, Users } from '@repo/ui/icons'

import type { TeamCardModel } from '../model/types'

interface Props {
	team: TeamCardModel
	onOpen: (team: TeamCardModel) => void
}

function TeamCard({ team, onOpen }: Props) {
	return (
		<button
			type='button'
			onClick={() => onOpen(team)}
			className={cn(
				'group flex h-[184px] w-full cursor-pointer flex-col justify-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card p-5 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
			)}
		>
			<div className='flex items-start justify-between'>
				<div className='flex size-8 items-center justify-center rounded-[calc(var(--radius-control)-2px)] bg-primary/10 text-primary'>
					<Users className='size-4' />
				</div>
				<ArrowRight className='size-4 text-muted-foreground transition-colors group-hover:text-foreground' />
			</div>

			<div className='space-y-1.5'>
				<h3 className='text-[16px] font-semibold leading-5 tracking-tight text-card-foreground'>
					{team.name}
				</h3>

				<div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] leading-4 text-muted-foreground'>
					<span className='inline-flex items-center gap-2'>
						<Users className='size-[13px]' />
						{team.members.length} участников
					</span>
					<span className='inline-flex items-center gap-2'>
						<FolderKanban className='size-[13px]' />
						{team.projectCount} проектов
					</span>
				</div>
			</div>

			<div className='flex items-center'>
				<div className='flex items-center -space-x-2'>
					{team.members.slice(0, 4).map((member) => (
						<Avatar key={member.id} className='size-6 border-2 border-card'>
							<AvatarFallback className='bg-surface-2 text-[9px] font-medium text-muted-foreground'>
								{member.avatar}
							</AvatarFallback>
						</Avatar>
					))}
				</div>

				{team.members.length > 4 && (
					<span className='ml-3 text-[12px] text-muted-foreground'>
						+{team.members.length - 4}
					</span>
				)}
			</div>
		</button>
	)
}

export { TeamCard }
