import { TEAM_ROLES, type TeamRole } from '@repo/types'
import { badgeToneVariants } from '@repo/ui/lib/badge-tones'

type ProfileRoleSummary = {
	label: string
	className: string
}

const profileCopy = {
	title: 'Личный кабинет',
	subtitle: 'Управление профилем и приглашениями',
	saveUnavailable: 'Сохранение профиля подключим после backend-части',
	retryAction: 'Повторить',
	userId: {
		label: 'ID пользователя',
		copyAction: 'Скопировать ID пользователя',
		copySuccess: 'ID пользователя скопирован',
		copyError: 'Не удалось скопировать ID. Выделите и скопируйте его вручную.',
	},
	fields: {
		name: 'Имя',
		email: 'Email',
		save: 'Сохранить',
	},
	teams: {
		title: 'Мои команды',
		loadErrorTitle: 'Не удалось загрузить команды',
		loadErrorDescription: 'Попробуйте повторить запрос ещё раз.',
		emptyTitle: 'Вы пока не состоите в командах',
		emptyDescription: 'Принятые приглашения и созданные команды появятся здесь.',
	},
	invitations: {
		title: 'Приглашения в команды',
		loadErrorTitle: 'Не удалось загрузить приглашения',
		loadErrorDescription: 'Попробуйте повторить запрос ещё раз.',
		emptyTitle: 'Новых приглашений нет',
		emptyDescription: 'Когда вас пригласят в команду, приглашение появится здесь.',
		newLabelSuffix: 'новых',
		acceptAction: 'Принять',
		acceptPendingAction: 'Принятие...',
		declineAction: 'Отклонить',
		declinePendingAction: 'Отклонение...',
		declineSuccess: 'Приглашение отклонено',
	},
	profileLoadError: {
		title: 'Не удалось загрузить профиль',
		description: 'Попробуйте обновить страницу или повторить запрос ещё раз.',
	},
} as const

const profileFormFieldIds = {
	name: 'profile-name',
	email: 'profile-email',
} as const

const profileRolePriority: TeamRole[] = [
	TEAM_ROLES.OWNER,
	TEAM_ROLES.ADMIN,
	TEAM_ROLES.MEMBER,
]

const profileRoleSummaryByValue: Record<TeamRole, ProfileRoleSummary> = {
	[TEAM_ROLES.OWNER]: {
		label: 'Владелец',
		className: badgeToneVariants({ tone: 'owner' }),
	},
	[TEAM_ROLES.ADMIN]: {
		label: 'Администратор',
		className: badgeToneVariants({ tone: 'admin' }),
	},
	[TEAM_ROLES.MEMBER]: {
		label: 'Участник',
		className: badgeToneVariants({ tone: 'member' }),
	},
}

export {
	profileCopy,
	profileFormFieldIds,
	profileRolePriority,
	profileRoleSummaryByValue,
	type ProfileRoleSummary,
}
