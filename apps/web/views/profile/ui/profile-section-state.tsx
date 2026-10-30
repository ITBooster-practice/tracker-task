import { Button, EmptyState } from '@repo/ui'

import { profileCopy } from '../config/constants'
import {
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
				headingLevel='h2'
				title={title}
				description={description}
				action={
					onRetry ? (
						<Button type='button' onClick={() => void onRetry()}>
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
