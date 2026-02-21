import defautlConfig from '@repo/eslint-config/prettier-base'

const config = {
	...defautlConfig,
	plugins: ['@ianvs/prettier-plugin-sort-imports'],
	importOrder: [
		'<BUILTIN_MODULES>',
		'<THIRD_PARTY_MODULES>',
		'',
		'^@repo(.*)$',
		'',
		'^[../]',
		'^[./]',
	],
	importOrderParserPlugins: ['typescript', 'jsx'],
	importOrderTypeScriptVersion: '5.0.0',
	importOrderCaseSensitive: false,
	importOrderMergeDuplicateImports: true,
	importOrderCombineTypeAndValueImports: true,
	importOrderSortSpecifiers: true,
}

/** @type {import("prettier").Config} */
export default config
