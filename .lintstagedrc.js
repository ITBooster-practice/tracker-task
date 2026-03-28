module.exports = {
	// Линт и форматирование TS/TSX файлов в apps и packages
	'{apps,packages}/**/*.{ts,tsx}': (stagedFiles) => {
		// Убираем prisma
		const validFiles = stagedFiles.filter(
			(filePath) => !filePath.includes('/prisma/') && !filePath.includes('\\prisma\\'),
		)

		if (validFiles.length === 0) return []

		// Экранируем пути (важно для Windows)
		const escapedFiles = validFiles.map((file) => `"${file}"`).join(' ')

		return [
			// ESLint сам найдёт eslint.config.mjs в корне
			`eslint --fix ${escapedFiles}`,

			// Форматирование
			`prettier --write ${escapedFiles}`,
		]
	},

	// Для всех остальных JS/TSX/TS/JSX файлов внутри apps и packages
	// ESLint и Prettier будут применяться только к staged файлам
	'{apps,packages}/*/**/*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --fix'],

	// Форматирование остальных JSON, MD и YML файлов
	'*.{json,md,yml}': ['prettier --write'],
}
