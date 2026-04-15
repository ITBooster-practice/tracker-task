import { TEAM_ROLES, type TeamRole } from '@repo/types'
import { Crown, Mail, Settings2, Shield, Trash2, Users } from '@repo/ui/icons'

const TEAM_SETTINGS_TEXT = {
	pageTitle: 'Настройки команды',
	pageSubtitleFallback: 'Загрузка команды',
	retryAction: 'Повторить',
	cancelAction: 'Отмена',
	emptyState: {
		title: 'Не удалось загрузить команду',
		description: 'Попробуйте повторить запрос ещё раз.',
	},
	roles: {
		title: 'Роли',
	},
	members: {
		title: 'Участники',
		loading: 'Загрузка участников...',
		inviteAction: 'Пригласить',
		rolePlaceholder: 'Выберите роль',
		roleUpdated: 'Роль участника обновлена',
		removeActionLabel: 'Удалить',
		removeSuccess: 'Участник исключён из команды',
		selfLeaveSuccess: 'Вы покинули команду',
	},
	invitations: {
		title: 'Приглашения',
		loading: 'Загрузка приглашений...',
		loadErrorTitle: 'Не удалось загрузить приглашения',
		loadErrorDescription: 'Попробуйте повторить запрос ещё раз.',
		emptyTitle: 'Нет активных приглашений',
		emptyDescription: 'Отправленные приглашения появятся здесь.',
		inviteTitle: 'Пригласить участника',
		inviteDescription:
			'Отправим приглашение на email и дадим доступ к команде после принятия.',
		emailLabel: 'Email',
		roleLabel: 'Роль',
		emailPlaceholder: 'user@company.com',
		submitAction: 'Отправить приглашение',
		submitPendingAction: 'Отправка...',
		sendSuccess: 'Приглашение отправлено',
		revokeAction: 'Отозвать',
		revokePendingAction: 'Отзыв...',
		revokeSuccess: 'Приглашение отозвано',
	},
	deleteMemberDialog: {
		title: 'Удалить участника из команды?',
		description: (memberName: string) =>
			`${memberName} больше не сможет работать в этой команде.`,
		confirm: 'Удалить',
		pending: 'Удаление...',
	},
	leaveTeamDialog: {
		title: 'Покинуть команду?',
		description: (memberName: string) =>
			`${memberName} потеряет доступ к команде сразу после подтверждения.`,
		confirm: 'Покинуть',
		pending: 'Выход...',
	},
	dangerZone: {
		title: 'Удаление команды',
		description:
			'Команда, участники и приглашения будут удалены без возможности восстановления.',
		action: 'Удалить команду',
		success: 'Команда успешно удалена',
		dialogTitle: 'Удалить команду?',
		dialogDescription:
			'Это действие необратимо. Команда и связанные данные будут удалены окончательно.',
		dialogConfirm: 'Удалить команду',
		dialogPending: 'Удаление...',
	},
} as const

const TEAM_SETTINGS_ASSIGNABLE_ROLES = [TEAM_ROLES.ADMIN, TEAM_ROLES.MEMBER] as const

type TeamAssignableRole = (typeof TEAM_SETTINGS_ASSIGNABLE_ROLES)[number]

const TEAM_SETTINGS_ROLE_BADGE_CLASSNAME_BY_ROLE: Record<TeamRole, string> = {
	[TEAM_ROLES.OWNER]:
		'border-amber-300 bg-amber-100/80 text-amber-900 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-300',
	[TEAM_ROLES.ADMIN]:
		'border-sky-200 bg-sky-50 text-sky-700 dark:border-primary/15 dark:bg-primary/10 dark:text-primary',
	[TEAM_ROLES.MEMBER]:
		'border-slate-200 bg-slate-50 text-slate-700 dark:border-border/60 dark:bg-surface-2 dark:text-muted-foreground',
}

const TEAM_SETTINGS_ROLE_OPTIONS = [
	{
		value: TEAM_ROLES.OWNER,
		label: 'Владелец',
		description: 'Полный доступ к команде и всем действиям управления.',
		icon: Crown,
		iconClassName: 'text-amber-400',
	},
	{
		value: TEAM_ROLES.ADMIN,
		label: 'Администратор',
		description: 'Управляет участниками, приглашениями и настройками команды.',
		icon: Shield,
		iconClassName: 'text-primary',
	},
	{
		value: TEAM_ROLES.MEMBER,
		label: 'Участник',
		description: 'Работает с задачами и проектами без административных действий.',
		icon: Users,
		iconClassName: 'text-muted-foreground',
	},
] as const

const TEAM_SETTINGS_SECTION_ICONS = {
	roles: Settings2,
	members: Users,
	invitations: Mail,
	dangerZone: Trash2,
} as const

export {
	TEAM_SETTINGS_ASSIGNABLE_ROLES,
	TEAM_SETTINGS_ROLE_BADGE_CLASSNAME_BY_ROLE,
	TEAM_SETTINGS_ROLE_OPTIONS,
	TEAM_SETTINGS_SECTION_ICONS,
	TEAM_SETTINGS_TEXT,
	type TeamAssignableRole,
}
