import { cn, Skeleton } from '@repo/ui'

import { profileListWrapClassName, profileSkeletonRowClassName } from '../lib/styles'

type ProfileListSkeletonProps = {
	actionCount?: number
	rowCount?: number
}

const ProfileListSkeleton = ({
	actionCount = 1,
	rowCount = 2,
}: ProfileListSkeletonProps) => {
	return (
		<div className={profileListWrapClassName}>
			{Array.from({ length: rowCount }).map((_, index) => (
				<div
					key={`profile-list-skeleton-${index}`}
					className={cn(
						profileSkeletonRowClassName,
						'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
					)}
				>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 shrink-0 rounded-[var(--radius-control)]' />
						<div className='space-y-2'>
							<Skeleton className='h-4 w-24 sm:w-32' />
							<Skeleton className='h-4 w-20 sm:w-24' />
						</div>
					</div>
					<div className='flex gap-2'>
						{Array.from({ length: actionCount }).map((__, actionIndex) => (
							<Skeleton
								key={`profile-list-skeleton-${index}-action-${actionIndex}`}
								className='h-9 w-20 rounded-[var(--radius-control)]'
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export { ProfileListSkeleton }
