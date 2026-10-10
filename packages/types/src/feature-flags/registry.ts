export const FEATURE_KEYS = {
	PROJECTS: 'projects',
	TASKS: 'tasks',
	BOARDS: 'boards',
	TEAM_SETTINGS: 'team-settings',
} as const

// Запись добавляется вместе с проверками флага в коде и выпускается в составе обновления.
export const FEATURE_REGISTRY: Readonly<Record<string, string>> = {
	[FEATURE_KEYS.PROJECTS]: 'Проекты',
	[FEATURE_KEYS.TASKS]: 'Задачи',
	[FEATURE_KEYS.BOARDS]: 'Доски',
	[FEATURE_KEYS.TEAM_SETTINGS]: 'Настройки команды',
}

export function getConnectedFeature(key: string): string | null {
	return Object.hasOwn(FEATURE_REGISTRY, key) ? (FEATURE_REGISTRY[key] ?? null) : null
}

// Удалять ключ можно только после удаления его проверок из всех поддерживаемых версий приложения.
export const REQUIRED_FEATURE_KEYS: readonly string[] = Object.keys(FEATURE_REGISTRY)
