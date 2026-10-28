export function boardData(name: string, isDefault = false) {
	return {
		name,
		isDefault,
		columns: {
			create: [
				{ key: 'TODO', title: 'К выполнению', position: 0, isSystem: isDefault },
				{ key: 'IN_PROGRESS', title: 'В работе', position: 1, isSystem: isDefault },
				{ key: 'IN_REVIEW', title: 'На проверке', position: 2, isSystem: isDefault },
				{ key: 'DONE', title: 'Готово', position: 3, isSystem: isDefault },
			],
		},
	}
}

export function defaultBoardData() {
	return boardData('Основная доска', true)
}
