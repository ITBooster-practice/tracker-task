module.exports = {
    // Проверка и форматирование TypeScript/React файлов в приложениях
    'apps/**/*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write'
    ],
    // Проверка и форматирование TypeScript/React файлов в пакетах
    'packages/**/*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write'
    ],
    // Форматирование остальных файлов (JSON, MD, YML)
    '*.{json,md,yml}': [
        'prettier --write'
    ]
};
