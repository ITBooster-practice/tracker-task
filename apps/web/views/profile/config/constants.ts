import { TEAM_ROLES, type TeamRole } from '@repo/types'

type ProfileRoleSummary = {
	label: string
	className: string
}

const profileCopy = {
	title: 'Личный кабинет',
	subtitle: 'Управление профилем и приглашениями',
	saveUnavailable: 'Сохранение профиля подключим после backend-части',
	retryAction: 'Повторить',
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
		className:
			'border-amber-300 bg-amber-100/80 text-amber-900 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-300',
	},
	[TEAM_ROLES.ADMIN]: {
		label: 'Администратор',
		className:
			'border-sky-200 bg-sky-50 text-sky-700 dark:border-primary/15 dark:bg-primary/10 dark:text-primary',
	},
	[TEAM_ROLES.MEMBER]: {
		label: 'Участник',
		className:
			'border-slate-200 bg-slate-50 text-slate-700 dark:border-border/60 dark:bg-surface-2 dark:text-muted-foreground',
	},
}

export {
	profileCopy,
	profileFormFieldIds,
	profileRolePriority,
	profileRoleSummaryByValue,
	type ProfileRoleSummary,
}
