export const FEATURE_KEYS = {
	AI_ASSISTANT: 'ai-assistant',
	NOTIFICATIONS: 'notifications',
	TASKS: 'tasks',
	BOARDS: 'boards',
	BACKLOG: 'backlog',
} as const

// Add each registry entry together with its feature checks in the same release.
export const FEATURE_REGISTRY: Readonly<Record<string, string>> = {
	[FEATURE_KEYS.AI_ASSISTANT]: 'AI Ассистент',
	[FEATURE_KEYS.NOTIFICATIONS]: 'Уведомления',
	[FEATURE_KEYS.TASKS]: 'Задачи',
	[FEATURE_KEYS.BOARDS]: 'Доски',
	[FEATURE_KEYS.BACKLOG]: 'Бэклог',
}

export function getConnectedFeature(key: string): string | null {
	return Object.hasOwn(FEATURE_REGISTRY, key) ? (FEATURE_REGISTRY[key] ?? null) : null
}
