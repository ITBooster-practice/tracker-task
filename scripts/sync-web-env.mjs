import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const targetPath = resolve(process.cwd(), 'apps/web/.env.development')
// Сохраняем локальные настройки; состояния флагов загружаются из API.
const content = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : ''
if (!/^NEXT_PUBLIC_API_URL=/m.test(content)) {
	mkdirSync(dirname(targetPath), { recursive: true })
	writeFileSync(
		targetPath,
		content +
			(content && !content.endsWith('\n') ? '\n' : '') +
			'NEXT_PUBLIC_API_URL=http://localhost:3000\n',
	)
}
