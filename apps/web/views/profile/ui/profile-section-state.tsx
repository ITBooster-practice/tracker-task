import { Button, EmptyState } from '@repo/ui'

import { profileCopy } from '../config/constants'
import {
	profilePrimaryButtonClassName,
	profileSectionCenteredEmptyStateClassName,
	profileSectionCenteredEmptyWrapClassName,
	profileSectionEmptyStateClassName,
	profileSectionEmptyWrapClassName,
} from '../lib/styles'

type ProfileSectionStateProps = {
	centered?: boolean
	description: string
	onRetry?: () => void
	title: string
}

const ProfileSectionState = ({
	centered = false,
	description,
	onRetry,
	title,
}: ProfileSectionStateProps) => {
	return (
		<div
			className={
				centered
					? profileSectionCenteredEmptyWrapClassName
					: profileSectionEmptyWrapClassName
			}
		>
			<EmptyState
				title={title}
				description={description}
				action={
					onRetry ? (
						<Button
							type='button'
							onClick={() => void onRetry()}
							className={profilePrimaryButtonClassName}
						>
							{profileCopy.retryAction}
						</Button>
					) : undefined
				}
				className={
					centered
						? profileSectionCenteredEmptyStateClassName
						: profileSectionEmptyStateClassName
				}
			/>
		</div>
	)
}

export { ProfileSectionState }
