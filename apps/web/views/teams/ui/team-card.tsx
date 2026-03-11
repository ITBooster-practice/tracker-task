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
				'group flex h-[194px] w-full cursor-pointer flex-col rounded-lg border border-border bg-card p-5 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
			)}
		>
			<div className='mb-5 flex items-start justify-between'>
				<div className='flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary'>
					<Users className='size-[18px]' />
				</div>
				<ArrowRight className='size-5 text-muted-foreground transition-colors group-hover:text-foreground' />
			</div>

			<h3 className='mb-1.5 text-[18px] font-semibold leading-6 tracking-tight text-card-foreground'>
				{team.name}
			</h3>

			<div className='flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] leading-5 text-muted-foreground'>
				<span className='inline-flex items-center gap-2'>
					<Users className='size-[14px]' />
					{team.members.length} участников
				</span>
				<span className='inline-flex items-center gap-2'>
					<FolderKanban className='size-[14px]' />
					{team.projectCount} проектов
				</span>
			</div>

			<div className='mt-4 flex items-center'>
				<div className='flex items-center -space-x-2'>
					{team.members.slice(0, 4).map((member) => (
						<Avatar key={member.id} className='size-7 border-2 border-card'>
							<AvatarFallback className='bg-surface-2 text-[10px] font-medium text-muted-foreground'>
								{member.avatar}
							</AvatarFallback>
						</Avatar>
					))}
				</div>

				{team.members.length > 4 && (
					<span className='ml-3 text-sm text-muted-foreground'>
						+{team.members.length - 4}
					</span>
				)}
			</div>
		</button>
	)
}

export { TeamCard }
