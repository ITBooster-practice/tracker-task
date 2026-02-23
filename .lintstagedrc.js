module.exports = {
    // Проверка и форматирование TypeScript/React файлов в приложениях и пакетах
    '{apps,packages}/*/**/*.{ts,tsx}': (files) => {
        const commands = [];
        const workspaceFiles = {};

				 // Фильтруем файлы из prisma директории
        const filteredFiles = files.filter(file => !file.includes('/prisma/') && !file.includes('\\prisma\\'));

        if (filteredFiles.length === 0) return [];

        // Группируем файлы по их рабочим пространствам (workspaces)
        for (const file of filteredFiles) {
            const match = file.match(/^(.*?\/(?:apps|packages)\/[^\/]+)/);
            if (match) {
                const workspace = match[1];
                if (!workspaceFiles[workspace]) {
                    workspaceFiles[workspace] = [];
                }
                workspaceFiles[workspace].push(file);
            }
        }

        // Генерируем команды для каждого рабочего пространства отдельно
        for (const [workspace, filesInWorkspace] of Object.entries(workspaceFiles)) {
            const escapedFiles = filesInWorkspace.map(f => `"${f}"`).join(' ');
            commands.push(`cd "${workspace}" && npx eslint --fix ${escapedFiles}`);
            commands.push(`prettier --write ${escapedFiles}`);
        }

        return commands;
    },
    // Форматирование остальных файлов (JSON, MD, YML)
    '*.{json,md,yml}': [
        'prettier --write'
    ]
};
