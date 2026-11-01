export function boardData(name: string, isDefault = false) {
	return {
		name,
		isDefault,
		columns: {
			create: [
				{
					key: 'TODO',
					title: 'К выполнению',
					color: 'blue',
					position: 0,
					isSystem: isDefault,
				},
				{
					key: 'IN_PROGRESS',
					title: 'В работе',
					color: 'yellow',
					position: 1,
					isSystem: isDefault,
				},
				{
					key: 'IN_REVIEW',
					title: 'На проверке',
					color: 'violet',
					position: 2,
					isSystem: isDefault,
				},
				{
					key: 'DONE',
					title: 'Готово',
					color: 'green',
					position: 3,
					isSystem: isDefault,
				},
			],
		},
	}
}

export function defaultBoardData() {
	return boardData('Основная доска', true)
}
