import { type PaginationMeta, type TeamInvitation } from '@repo/types'
import { Badge, Button, cn, EmptyState, Pagination } from '@repo/ui'

import {
	TEAM_SETTINGS_SECTION_ICONS,
	TEAM_SETTINGS_TEXT,
} from '../config/team-settings.constants'
import {
	teamPagePrimaryButtonClassName,
	teamSettingsBadgeClassName,
	teamSettingsListRowClassName,
	teamSettingsMemberEmailClassName,
	teamSettingsMemberNameClassName,
	teamSettingsRowActionsClassName,
	teamSettingsSectionBodyClassName,
	teamSettingsSectionEmptyStateClassName,
} from '../lib/styles'
import {
	getInvitationMeta,
	getPendingTeamInvitations,
	getTeamRoleBadgeClassName,
	getTeamRoleLabel,
} from '../lib/team-settings'
import { TeamSettingsSection } from './team-settings-section'

type TeamSettingsInvitationsSectionProps = {
	invitations: TeamInvitation[]
	isError: boolean
	isLoading: boolean
	meta?: PaginationMeta
	onPageChange?: (page: number) => void
	onRetry: () => void
	onRevoke: (invitation: TeamInvitation) => void
	pendingInvitationId: string | null
}

const TeamSettingsInvitationsSection = ({
	invitations,
	isError,
	isLoading,
	meta,
	onPageChange,
	onRetry,
	onRevoke,
	pendingInvitationId,
}: TeamSettingsInvitationsSectionProps) => {
	const pendingInvitations = getPendingTeamInvitations(invitations)
	const totalCount = pendingInvitations.length

	if (!isLoading && !isError && totalCount === 0) {
		return null
	}

	return (
		<TeamSettingsSection
			title={`${TEAM_SETTINGS_TEXT.invitations.title} (${totalCount})`}
			icon={TEAM_SETTINGS_SECTION_ICONS.invitations}
		>
			{isLoading ? (
				<div
					className={cn(
						teamSettingsSectionBodyClassName,
						'text-sm text-muted-foreground',
					)}
				>
					{TEAM_SETTINGS_TEXT.invitations.loading}
				</div>
			) : isError ? (
				<div className='flex justify-center p-4'>
					<EmptyState
						title={TEAM_SETTINGS_TEXT.invitations.loadErrorTitle}
						description={TEAM_SETTINGS_TEXT.invitations.loadErrorDescription}
						action={
							<Button
								type='button'
								onClick={() => void onRetry()}
								className={teamPagePrimaryButtonClassName}
							>
								{TEAM_SETTINGS_TEXT.retryAction}
							</Button>
						}
						className={teamSettingsSectionEmptyStateClassName}
					/>
				</div>
			) : (
				<div>
					{pendingInvitations.map((invitation) => {
						const isRevokePending = pendingInvitationId === invitation.id

						return (
							<div key={invitation.id} className={teamSettingsListRowClassName}>
								<div className='min-w-0'>
									<div className={teamSettingsMemberNameClassName}>
										{invitation.email}
									</div>
									<div className={teamSettingsMemberEmailClassName}>
										{getInvitationMeta(invitation)}
									</div>
								</div>

								<div className={teamSettingsRowActionsClassName}>
									<Badge
										variant='outline'
										className={cn(
											teamSettingsBadgeClassName,
											getTeamRoleBadgeClassName(invitation.role),
										)}
									>
										{getTeamRoleLabel(invitation.role)}
									</Badge>
									<Button
										type='button'
										variant='outline'
										onClick={() => onRevoke(invitation)}
										disabled={isRevokePending}
									>
										{isRevokePending
											? TEAM_SETTINGS_TEXT.invitations.revokePendingAction
											: TEAM_SETTINGS_TEXT.invitations.revokeAction}
									</Button>
								</div>
							</div>
						)
					})}

					{meta && meta.totalPages > 1 && onPageChange && (
						<Pagination meta={meta} onPageChange={onPageChange} className='py-3' />
					)}
				</div>
			)}
		</TeamSettingsSection>
	)
}

export { TeamSettingsInvitationsSection }
