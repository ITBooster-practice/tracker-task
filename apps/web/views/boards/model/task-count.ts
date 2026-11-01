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
