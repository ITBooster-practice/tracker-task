import { cn } from '@repo/ui/lib/utils'

import { Skeleton } from '../skeleton'

function CardSkeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='card-skeleton'
			className={cn(
				'bg-card flex h-[184px] w-full flex-col justify-between rounded-[var(--radius-surface)] border border-border p-5',
				className,
			)}
			{...props}
		>
			<div className='space-y-2'>
				<Skeleton className='h-5 w-2/5' />
				<Skeleton className='h-4 w-3/5' />
			</div>

			<div className='space-y-2'>
				<Skeleton className='h-4 w-full' />
				<Skeleton className='h-4 w-4/5' />
			</div>

			<Skeleton className='h-4 w-24' />
		</div>
	)
}

export { CardSkeleton }
