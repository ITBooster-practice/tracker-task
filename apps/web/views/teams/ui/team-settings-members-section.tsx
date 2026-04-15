import { type TeamMember, type TeamRole } from '@repo/types'
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	cn,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { Trash2 } from '@repo/ui/icons'

import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

import {
	TEAM_SETTINGS_ASSIGNABLE_ROLES,
	TEAM_SETTINGS_ROLE_OPTIONS,
	TEAM_SETTINGS_SECTION_ICONS,
	TEAM_SETTINGS_TEXT,
	type TeamAssignableRole,
} from '../config/team-settings.constants'
import {
	teamSettingsBadgeClassName,
	teamSettingsListRowClassName,
	teamSettingsMemberAvatarClassName,
	teamSettingsMemberAvatarFallbackClassName,
	teamSettingsMemberEmailClassName,
	teamSettingsMemberIdentityClassName,
	teamSettingsMemberNameClassName,
	teamSettingsRemoveButtonClassName,
	teamSettingsRoleSelectClassName,
	teamSettingsRowActionsClassName,
	teamSettingsSectionBodyClassName,
	teamSettingsSectionEmptyStateClassName,
} from '../lib/styles'
import {
	canChangeMemberRole,
	canRemoveMember,
	getTeamRoleBadgeClassName,
	getTeamRoleLabel,
} from '../lib/team-settings'
import { TeamSettingsSection } from './team-settings-section'

type TeamSettingsMembersSectionProps = {
	currentUserId: string | undefined
	currentUserRole: TeamRole | undefined
	isError: boolean
	isLoading: boolean
	isMutatingRoleForUserId: string | null
	members: TeamMember[]
	onOpenRemoveDialog: (member: TeamMember) => void
	onRoleChange: (member: TeamMember, nextRole: TeamAssignableRole) => void
	onRetry: () => void
}

const TeamSettingsMembersSection = ({
	currentUserId,
	currentUserRole,
	isError,
	isLoading,
	isMutatingRoleForUserId,
	members,
	onOpenRemoveDialog,
	onRoleChange,
	onRetry,
}: TeamSettingsMembersSectionProps) => {
	return (
		<TeamSettingsSection
			title={`${TEAM_SETTINGS_TEXT.members.title} (${members.length})`}
			icon={TEAM_SETTINGS_SECTION_ICONS.members}
		>
			{isLoading ? (
				<div
					className={cn(
						teamSettingsSectionBodyClassName,
						'text-sm text-muted-foreground',
					)}
				>
					{TEAM_SETTINGS_TEXT.members.loading}
				</div>
			) : isError ? (
				<div className='flex justify-center p-4'>
					<EmptyState
						title={TEAM_SETTINGS_TEXT.emptyState.title}
						description={TEAM_SETTINGS_TEXT.emptyState.description}
						action={
							<Button type='button' onClick={() => void onRetry()}>
								{TEAM_SETTINGS_TEXT.retryAction}
							</Button>
						}
						className={teamSettingsSectionEmptyStateClassName}
					/>
				</div>
			) : (
				<div>
					{members.map((member) => {
						const memberName = getUserDisplayName(member)
						const canChangeRoleForMember = canChangeMemberRole(
							currentUserId,
							currentUserRole,
							member,
						)
						const canRemoveCurrentMember = canRemoveMember(
							currentUserId,
							currentUserRole,
							member,
						)
						const isRoleChangePending = isMutatingRoleForUserId === member.userId

						return (
							<div key={member.id} className={teamSettingsListRowClassName}>
								<div className={teamSettingsMemberIdentityClassName}>
									<Avatar className={teamSettingsMemberAvatarClassName}>
										<AvatarFallback className={teamSettingsMemberAvatarFallbackClassName}>
											{getNameInitials(memberName)}
										</AvatarFallback>
									</Avatar>

									<div className='min-w-0 flex-1'>
										<div className={teamSettingsMemberNameClassName}>{memberName}</div>
										<div className={teamSettingsMemberEmailClassName}>{member.email}</div>
									</div>
								</div>

								<div className={teamSettingsRowActionsClassName}>
									<Badge
										variant='outline'
										className={cn(
											teamSettingsBadgeClassName,
											getTeamRoleBadgeClassName(member.role),
										)}
									>
										{getTeamRoleLabel(member.role)}
									</Badge>

									{canChangeRoleForMember ? (
										<Select
											value={member.role}
											onValueChange={(value) =>
												onRoleChange(member, value as TeamAssignableRole)
											}
										>
											<SelectTrigger className={teamSettingsRoleSelectClassName}>
												<SelectValue
													placeholder={TEAM_SETTINGS_TEXT.members.rolePlaceholder}
												/>
											</SelectTrigger>
											<SelectContent className='border-border bg-popover'>
												{TEAM_SETTINGS_ROLE_OPTIONS.filter((option) =>
													TEAM_SETTINGS_ASSIGNABLE_ROLES.includes(
														option.value as (typeof TEAM_SETTINGS_ASSIGNABLE_ROLES)[number],
													),
												).map((option) => (
													<SelectItem
														key={option.value}
														value={option.value}
														disabled={isRoleChangePending}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : null}

									{canRemoveCurrentMember ? (
										<Button
											variant='ghost'
											size='icon-sm'
											onClick={() => onOpenRemoveDialog(member)}
											className={teamSettingsRemoveButtonClassName}
											aria-label={`${TEAM_SETTINGS_TEXT.members.removeActionLabel} ${memberName}`}
										>
											<Trash2 className='size-[15px]' />
										</Button>
									) : null}
								</div>
							</div>
						)
					})}
				</div>
			)}
		</TeamSettingsSection>
	)
}

export { TeamSettingsMembersSection }
