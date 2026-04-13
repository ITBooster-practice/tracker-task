import { Skeleton } from '@repo/ui'

function TeamCardSkeleton() {
	return (
		<div className='flex h-[184px] w-full flex-col justify-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card p-5'>
			{/* Icon + arrow */}
			<div className='flex items-start justify-between'>
				<Skeleton className='size-8 rounded-[calc(var(--radius-control)-2px)]' />
				<Skeleton className='size-4' />
			</div>

			{/* Name + stats */}
			<div className='space-y-1.5'>
				<Skeleton className='h-5 w-2/5' />

				<div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
					<Skeleton className='h-4 w-20' />
					<Skeleton className='h-4 w-20' />
				</div>
			</div>

			{/* Avatars */}
			<div className='flex items-center'>
				<div className='flex items-center -space-x-2'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className='size-6 rounded-full border-2 border-card' />
					))}
				</div>
			</div>
		</div>
	)
}

export { TeamCardSkeleton }
