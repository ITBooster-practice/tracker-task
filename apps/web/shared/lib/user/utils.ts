type UserIdentitySource = {
	name?: string | null
	email?: string | null
}

const defaultUserDisplayName = 'Пользователь'

function getUserDisplayName(user?: UserIdentitySource | null) {
	return user?.name?.trim() || user?.email || defaultUserDisplayName
}

function getNameInitials(value?: string | null) {
	return (value ?? '')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

export { getNameInitials, getUserDisplayName }
