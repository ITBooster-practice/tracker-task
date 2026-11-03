const taskPlural = new Intl.PluralRules('ru-RU')
const taskForms: Partial<Record<Intl.LDMLPluralRule, string>> = {
	one: 'задача',
	few: 'задачи',
	many: 'задач',
}

export function formatBoardTaskCount(
	count: number,
	grammaticalCase: 'nominative' | 'genitive' = 'nominative',
) {
	const plural = taskPlural.select(count)
	const form =
		grammaticalCase === 'genitive'
			? plural === 'one'
				? 'задачи'
				: 'задач'
			: (taskForms[plural] ?? 'задач')
	return `${count} ${form}`
}

export function formatPendingBoardTaskCount(count: number) {
	const plural = taskPlural.select(count)
	return `${count} ${plural === 'one' ? 'локальная' : plural === 'few' ? 'локальные' : 'локальных'}`
}
