import {
	TEAM_INVITATION_STATUSES,
	TEAM_ROLES,
	type TeamInvitation,
	type TeamMember,
	type TeamRole,
} from '@repo/types'

import {
	TEAM_SETTINGS_ROLE_BADGE_CLASSNAME_BY_ROLE,
	TEAM_SETTINGS_ROLE_OPTIONS,
	TEAM_SETTINGS_TEXT,
} from '../config/team-settings.constants'

const invitationDateFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'short',
})

function isTeamManagerRole(role?: TeamRole | null) {
	return role === TEAM_ROLES.OWNER || role === TEAM_ROLES.ADMIN
}

function canDeleteTeam(role?: TeamRole | null) {
	return role === TEAM_ROLES.OWNER
}

function canChangeMemberRole(
	currentUserId: string | undefined,
	currentUserRole: TeamRole | undefined,
	member: TeamMember,
) {
	if (!currentUserId || !isTeamManagerRole(currentUserRole)) {
		return false
	}

	if (member.userId === currentUserId) {
		return false
	}

	return member.role !== TEAM_ROLES.OWNER
}

function canRemoveMember(
	currentUserId: string | undefined,
	currentUserRole: TeamRole | undefined,
	member: TeamMember,
) {
	if (!currentUserId) {
		return false
	}

	if (member.role === TEAM_ROLES.OWNER) {
		return false
	}

	if (member.userId === currentUserId) {
		return currentUserRole !== TEAM_ROLES.OWNER
	}

	if (currentUserRole === TEAM_ROLES.OWNER) {
		return true
	}

	if (currentUserRole === TEAM_ROLES.ADMIN) {
		return member.role !== TEAM_ROLES.ADMIN
	}

	return false
}

function getCurrentTeamMember(members: TeamMember[], currentUserId: string | undefined) {
	return members.find((member) => member.userId === currentUserId) ?? null
}

function getTeamRoleBadgeClassName(role: TeamRole) {
	return TEAM_SETTINGS_ROLE_BADGE_CLASSNAME_BY_ROLE[role]
}

function getTeamRoleLabel(role: TeamRole) {
	return TEAM_SETTINGS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

function getPendingTeamInvitations(invitations: TeamInvitation[]) {
	return invitations.filter(
		(invitation) => invitation.status === TEAM_INVITATION_STATUSES.PENDING,
	)
}

function getInvitationMeta(invitation: TeamInvitation) {
	return `${getTeamRoleLabel(invitation.role)} • до ${invitationDateFormatter.format(new Date(invitation.expiresAt))}`
}

function getDeleteMemberDialogCopy(isSelfAction: boolean) {
	return isSelfAction
		? TEAM_SETTINGS_TEXT.leaveTeamDialog
		: TEAM_SETTINGS_TEXT.deleteMemberDialog
}

function getDeleteMemberDescription(member: TeamMember, isSelfAction: boolean) {
	const memberName = member.name ?? member.email

	if (isSelfAction) {
		return TEAM_SETTINGS_TEXT.leaveTeamDialog.description(memberName)
	}

	return TEAM_SETTINGS_TEXT.deleteMemberDialog.description(memberName)
}

export {
	canChangeMemberRole,
	canDeleteTeam,
	canRemoveMember,
	getCurrentTeamMember,
	getDeleteMemberDescription,
	getDeleteMemberDialogCopy,
	getInvitationMeta,
	getPendingTeamInvitations,
	getTeamRoleBadgeClassName,
	getTeamRoleLabel,
	isTeamManagerRole,
}
