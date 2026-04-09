export const TEAM_INVITATION_EXPIRES_IN_HOURS = 48
export const TEAM_INVITATION_EXPIRES_IN_LABEL = '48 часов'
export const TEAM_INVITATION_EMAIL_SUBJECT = 'Вас пригласили в команду в Tracker Task'

export const INVITATION_ERROR_MESSAGES = {
	TEAM_NOT_FOUND: 'Команда не найдена',
	MANAGE_FORBIDDEN: 'Недостаточно прав для управления приглашениями',
	ALREADY_MEMBER: 'Пользователь уже состоит в команде',
	DUPLICATE_PENDING: 'Для этого email уже есть активное приглашение в команду',
	INVITATION_NOT_FOUND: 'Приглашение не найдено',
	INVITATION_ALREADY_PROCESSED: 'Приглашение уже обработано',
	INVITATION_EXPIRED: 'Срок действия приглашения истёк',
	INVITATION_EMAIL_MISMATCH: 'Это приглашение предназначено для другого email',
} as const

export const INVITATION_LOG_MESSAGES = {
	SEND_EMAIL_FAILED: 'Не удалось отправить письмо с приглашением в команду',
} as const
