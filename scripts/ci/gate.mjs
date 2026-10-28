import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function checksPassed({ plan, checks, api, web }) {
	if (
		plan !== 'success' ||
		!['true', 'false'].includes(api) ||
		!['true', 'false'].includes(web)
	)
		return false
	const selected = api === 'true' || web === 'true'
	return checks === (selected ? 'success' : 'skipped')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	if (
		!checksPassed({
			plan: process.env.PLAN_RESULT,
			checks: process.env.CHECKS_RESULT,
			api: process.env.CHECK_API,
			web: process.env.CHECK_WEB,
		})
	) {
		process.stderr.write('CI: обязательные проверки не завершились успешно\n')
		process.exitCode = 1
	}
}
