export function defaultBoardData() {
	return {
		name: 'Основная доска',
		isDefault: true,
		columns: {
			create: [
				{ key: 'TODO', title: 'К выполнению', position: 0, isSystem: true },
				{ key: 'IN_PROGRESS', title: 'В работе', position: 1, isSystem: true },
				{ key: 'IN_REVIEW', title: 'На проверке', position: 2, isSystem: true },
				{ key: 'DONE', title: 'Готово', position: 3, isSystem: true },
			],
		},
	}
}
