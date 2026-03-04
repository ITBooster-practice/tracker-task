module.exports = {
	// Проверка и форматирование TypeScript/React файлов в приложениях и пакетах
	'{apps,packages}/*/**/*.{ts,tsx}': (files) => {
		const commands = []
		const workspaceFiles = {}

		// Фильтруем файлы из prisma директории
		const filteredFiles = files.filter(
			(file) => !file.includes('/prisma/') && !file.includes('\\prisma\\'),
		)

		if (filteredFiles.length === 0) return []

		// Группируем файлы по их рабочим пространствам (workspaces)
		for (const file of filteredFiles) {
			const normalized = file.replace(/\\/g, '/')
			const match = normalized.match(/^(.*?\/(?:apps|packages)\/[^\/]+)/)
			if (match) {
				const workspace = match[1]
				if (!workspaceFiles[workspace]) {
					workspaceFiles[workspace] = []
				}
				workspaceFiles[workspace].push(file)
			}
		}

		// Генерируем команды: --config указывает ESLint точный конфиг без зависимости от cwd
		for (const [workspace, filesInWorkspace] of Object.entries(workspaceFiles)) {
			const escapedFiles = filesInWorkspace.map((f) => `"${f}"`).join(' ')
			commands.push(
				`npx eslint --config "${workspace}/eslint.config.mjs" --fix ${escapedFiles}`,
			)
			commands.push(`prettier --write ${escapedFiles}`)
		}

		return commands
	},
	// Форматирование остальных файлов (JSON, MD, YML)
	'*.{json,md,yml}': ['prettier --write'],
}
