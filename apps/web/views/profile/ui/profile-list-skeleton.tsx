import { cn, Skeleton } from '@repo/ui'

import {
	profileListWrapClassName,
	profileSectionCompactContentClassName,
	profileSkeletonRowClassName,
} from '../lib/styles'

type ProfileListSkeletonProps = {
	actionCount?: number
	rowCount?: number
}

const ProfileListSkeleton = ({
	actionCount = 1,
	rowCount = 2,
}: ProfileListSkeletonProps) => {
	return (
		<div className={cn(profileListWrapClassName, profileSectionCompactContentClassName)}>
			{Array.from({ length: rowCount }).map((_, index) => (
				<div
					key={`profile-list-skeleton-${index}`}
					className={cn(
						profileSkeletonRowClassName,
						'flex items-center justify-between gap-3',
					)}
				>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-9 rounded-[12px]' />
						<div className='space-y-2'>
							<Skeleton className='h-3.5 w-32' />
							<Skeleton className='h-3 w-24' />
						</div>
					</div>
					<div className='flex gap-2'>
						{Array.from({ length: actionCount }).map((__, actionIndex) => (
							<Skeleton
								key={`profile-list-skeleton-${index}-action-${actionIndex}`}
								className='h-8 w-20 rounded-[12px]'
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export { ProfileListSkeleton }
