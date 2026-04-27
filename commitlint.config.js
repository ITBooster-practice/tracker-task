module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2,
            'always',
            [
                'api',      // изменения в apps/api
                'web',      // изменения в apps/web
                'ui',       // изменения в packages/ui
				'pack',     // изменения в packages
                'libs',     // изменения в других библиотеках
                'config',   // настройки eslint, tsconfig и т.д.
                'repo',     // настройки монорепо, turborepo, ci
                'docs',     // документация
            ],
        ],
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'style',
                'refactor',
                'perf',
                'test',
                'chore',
                'revert',
                'ci',
            ],
        ],
    },
};
