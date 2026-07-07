import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const workspaceRoot = process.cwd()
const sourcePath = resolve(workspaceRoot, 'apps/web/.env.feature-flags')
const targetPath = resolve(workspaceRoot, 'apps/web/.env.development')

const sourceContent = readFileSync(sourcePath, 'utf8')

const publicLines = sourceContent
	.split(/\r?\n/)
	.map((line) => line.trim())
	.filter((line) => line.length > 0)
	.filter((line) => !line.startsWith('#'))
	.filter((line) => line.startsWith('NEXT_PUBLIC_'))
	.filter((line) => !line.startsWith('NEXT_PUBLIC_API_URL='))

const output = [
	'# Auto-generated from apps/web/.env.feature-flags. Do not edit manually.',
	'NEXT_PUBLIC_API_URL=http://localhost:3000',
	'',
	...publicLines,
	'',
].join('\n')

mkdirSync(dirname(targetPath), { recursive: true })
writeFileSync(targetPath, output)
