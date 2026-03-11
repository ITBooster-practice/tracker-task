import { TEAM_ROLES, type TeamListItem } from '@repo/types'

import type { TeamCardModel } from '../model/types'

function getTeamInitials(name: string) {
	const [firstWord = '', secondWord = ''] = name.trim().split(/\s+/)

	return `${firstWord[0] ?? ''}${secondWord[0] ?? ''}`.toUpperCase() || 'TM'
}

export function mapTeamListItemToTeamCardModel(team: TeamListItem): TeamCardModel {
	const initials = getTeamInitials(team.name)

	return {
		id: team.id,
		name: team.name,
		projectCount: 0,
		members: Array.from({ length: team.membersCount }, (_, index) => ({
			id: `${team.id}-member-${index + 1}`,
			name: `Участник ${index + 1}`,
			avatar: initials,
			role: index === 0 && team.currentUserRole === TEAM_ROLES.OWNER ? 'owner' : 'member',
		})),
	}
}
