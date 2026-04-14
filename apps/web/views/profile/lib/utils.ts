import { TEAM_ROLES, type MyInvitation, type TeamListItem } from '@repo/types'

import { getUserDisplayName } from '@/shared/lib/user'

import {
	profileRolePriority,
	profileRoleSummaryByValue,
	type ProfileRoleSummary,
} from '../config/constants'

const invitationDateFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
})

function getPrimaryRole(teams: TeamListItem[]): ProfileRoleSummary {
	const availableRoles = new Set(teams.map((team) => team.currentUserRole))
	const strongestRole =
		profileRolePriority.find((role) => availableRoles.has(role)) ?? TEAM_ROLES.MEMBER

	return profileRoleSummaryByValue[strongestRole]
}

function formatMembersCount(count: number) {
	if (count % 10 === 1 && count % 100 !== 11) {
		return `${count} участник`
	}

	if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
		return `${count} участника`
	}

	return `${count} участников`
}

function formatInvitationDate(value: string) {
	return invitationDateFormatter.format(new Date(value))
}

function getInvitationSubtitle(invitation: MyInvitation) {
	const inviterName = getUserDisplayName(invitation.invitedBy)

	return `Приглашение от ${inviterName} • ${formatInvitationDate(invitation.createdAt)}`
}

export { formatMembersCount, getInvitationSubtitle, getPrimaryRole }
