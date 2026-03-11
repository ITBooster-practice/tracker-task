import { TEAM_ROLES, type TeamRole } from '@repo/types'

type TeamSettingsMember = {
	id: string
	email: string
	name: string
	role: TeamRole
}

type TeamSettingsRecord = {
	id: string
	name: string
	members: TeamSettingsMember[]
}

const productTeamMembers: TeamSettingsMember[] = [
	{
		id: 'alexey-ivanov',
		name: 'Алексей Иванов',
		email: 'alexey@tracker.dev',
		role: TEAM_ROLES.OWNER,
	},
	{
		id: 'maria-petrova',
		name: 'Мария Петрова',
		email: 'maria@tracker.dev',
		role: TEAM_ROLES.ADMIN,
	},
	{
		id: 'dmitry-kozlov',
		name: 'Дмитрий Козлов',
		email: 'dmitry@tracker.dev',
		role: TEAM_ROLES.MEMBER,
	},
	{
		id: 'elena-sidorova',
		name: 'Елена Сидорова',
		email: 'elena@tracker.dev',
		role: TEAM_ROLES.MEMBER,
	},
	{
		id: 'pavel-novikov',
		name: 'Павел Новиков',
		email: 'pavel@tracker.dev',
		role: TEAM_ROLES.MEMBER,
	},
]

const teamSettingsById: Record<string, TeamSettingsRecord> = {
	'product-team': {
		id: 'product-team',
		name: 'Product Team',
		members: productTeamMembers,
	},
	'backend-team': {
		id: 'backend-team',
		name: 'Backend Team',
		members: [
			{
				id: 'dmitry-kozlov',
				name: 'Дмитрий Козлов',
				email: 'dmitry@tracker.dev',
				role: TEAM_ROLES.OWNER,
			},
			{
				id: 'elena-sidorova',
				name: 'Елена Сидорова',
				email: 'elena@tracker.dev',
				role: TEAM_ROLES.ADMIN,
			},
			{
				id: 'pavel-novikov',
				name: 'Павел Новиков',
				email: 'pavel@tracker.dev',
				role: TEAM_ROLES.MEMBER,
			},
		],
	},
}

const fallbackTeamSettings = teamSettingsById['product-team']!

function getMockTeamSettings(teamId: string): TeamSettingsRecord {
	return teamSettingsById[teamId] ?? fallbackTeamSettings
}

export { getMockTeamSettings }
export type { TeamSettingsMember }
