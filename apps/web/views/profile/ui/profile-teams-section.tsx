import { type TeamListItem } from '@repo/types'
import { Badge, cn } from '@repo/ui'
import { Users } from '@repo/ui/icons'

import { getNameInitials } from '@/shared/lib/user'

import { profileCopy, profileRoleSummaryByValue } from '../config/constants'
import {
	profileBadgeBaseClassName,
	profileItemAvatarClassName,
	profileItemBodyClassName,
	profileItemSubtitleClassName,
	profileItemTitleClassName,
	profileListWrapClassName,
	profileRowClassName,
	profileRowClickableClassName,
	profileSectionCompactContentClassName,
} from '../lib/styles'
import { formatMembersCount } from '../lib/utils'
import { ProfileListSkeleton } from './profile-list-skeleton'
import { ProfileSection } from './profile-section'
import { ProfileSectionState } from './profile-section-state'

type ProfileTeamsSectionProps = {
	isError: boolean
	isLoading: boolean
	onOpenTeam: (teamId: string) => void
	onRetry: () => void
	teams: TeamListItem[]
}

const ProfileTeamsSection = ({
	isError,
	isLoading,
	onOpenTeam,
	onRetry,
	teams,
}: ProfileTeamsSectionProps) => {
	return (
		<ProfileSection icon={<Users className='size-4' />} title={profileCopy.teams.title}>
			{isLoading ? (
				<ProfileListSkeleton />
			) : isError ? (
				<ProfileSectionState
					title={profileCopy.teams.loadErrorTitle}
					description={profileCopy.teams.loadErrorDescription}
					onRetry={onRetry}
				/>
			) : teams.length === 0 ? (
				<ProfileSectionState
					title={profileCopy.teams.emptyTitle}
					description={profileCopy.teams.emptyDescription}
				/>
			) : (
				<div
					className={cn(profileListWrapClassName, profileSectionCompactContentClassName)}
				>
					{teams.map((team) => {
						const teamRole = profileRoleSummaryByValue[team.currentUserRole]
						const teamInitials = getNameInitials(team.name)

						return (
							<button
								key={team.id}
								type='button'
								onClick={() => onOpenTeam(team.id)}
								className={cn(
									profileRowClassName,
									profileRowClickableClassName,
									'w-full text-left',
								)}
							>
								<div className='flex min-w-0 items-center gap-3'>
									<div className={profileItemAvatarClassName}>{teamInitials}</div>
									<div className={profileItemBodyClassName}>
										<p className={profileItemTitleClassName}>{team.name}</p>
										<p className={profileItemSubtitleClassName}>
											{formatMembersCount(team.membersCount)}
										</p>
									</div>
								</div>

								<Badge
									variant='outline'
									className={cn(profileBadgeBaseClassName, teamRole.className)}
								>
									{teamRole.label}
								</Badge>
							</button>
						)
					})}
				</div>
			)}
		</ProfileSection>
	)
}

export { ProfileTeamsSection }
