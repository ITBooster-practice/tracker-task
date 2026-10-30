import { type MyInvitation } from '@repo/types'
import { Button } from '@repo/ui'
import { Check, Mail, X } from '@repo/ui/icons'

import { getNameInitials } from '@/shared/lib/user'

import { profileCopy } from '../config/constants'
import {
	profileItemAvatarClassName,
	profileItemBodyClassName,
	profileItemSubtitleClassName,
	profileItemTitleClassName,
	profileListWrapClassName,
	profileRowClassName,
	profileSectionMetaBadgeClassName,
} from '../lib/styles'
import { getInvitationSubtitle } from '../lib/utils'
import { ProfileListSkeleton } from './profile-list-skeleton'
import { ProfileSection } from './profile-section'
import { ProfileSectionState } from './profile-section-state'

type InvitationActionState = {
	isPending: boolean
	token?: string
}

type ProfileInvitationsSectionProps = {
	acceptState: InvitationActionState
	declineState: InvitationActionState
	invitations: MyInvitation[]
	isError: boolean
	isLoading: boolean
	onAccept: (token: string) => void
	onDecline: (token: string) => void
	onRetry: () => void
}

const ProfileInvitationsSection = ({
	acceptState,
	declineState,
	invitations,
	isError,
	isLoading,
	onAccept,
	onDecline,
	onRetry,
}: ProfileInvitationsSectionProps) => {
	const pendingInvitationsCount = invitations.length

	if (!isLoading && !isError && pendingInvitationsCount === 0) {
		return null
	}

	return (
		<ProfileSection
			icon={<Mail className='size-4' />}
			title={profileCopy.invitations.title}
			badge={
				pendingInvitationsCount > 0 ? (
					<span className={profileSectionMetaBadgeClassName}>
						{pendingInvitationsCount} {profileCopy.invitations.newLabelSuffix}
					</span>
				) : undefined
			}
		>
			{isLoading ? (
				<ProfileListSkeleton actionCount={2} />
			) : isError ? (
				<ProfileSectionState
					title={profileCopy.invitations.loadErrorTitle}
					description={profileCopy.invitations.loadErrorDescription}
					onRetry={onRetry}
				/>
			) : (
				<div className={profileListWrapClassName}>
					{invitations.map((invitation) => {
						const isAcceptPending =
							acceptState.isPending && acceptState.token === invitation.token
						const isDeclinePending =
							declineState.isPending && declineState.token === invitation.token
						const isActionPending = isAcceptPending || isDeclinePending

						return (
							<div key={invitation.id} className={profileRowClassName}>
								<div className='flex min-w-0 items-center gap-3'>
									<div className={profileItemAvatarClassName}>
										{getNameInitials(invitation.team.name)}
									</div>
									<div className={profileItemBodyClassName}>
										<p className={profileItemTitleClassName}>{invitation.team.name}</p>
										<p className={profileItemSubtitleClassName}>
											{getInvitationSubtitle(invitation)}
										</p>
									</div>
								</div>

								<div className='flex shrink-0 flex-wrap items-center gap-2'>
									<Button
										type='button'
										onClick={() => onAccept(invitation.token)}
										disabled={isActionPending}
									>
										<Check className='size-4' />
										{isAcceptPending
											? profileCopy.invitations.acceptPendingAction
											: profileCopy.invitations.acceptAction}
									</Button>
									<Button
										type='button'
										variant='outline'
										onClick={() => onDecline(invitation.token)}
										disabled={isActionPending}
									>
										<X className='size-4' />
										{isDeclinePending
											? profileCopy.invitations.declinePendingAction
											: profileCopy.invitations.declineAction}
									</Button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</ProfileSection>
	)
}

export { ProfileInvitationsSection }
