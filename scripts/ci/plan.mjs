import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const commitPattern = /^[a-f\d]{40}(?:[a-f\d]{24})?$/i

export function classifyChanges(paths) {
	let api = false
	let web = false
	for (const path of paths) {
		if (path.startsWith('docs/') || path.endsWith('.md')) continue
		if (
			path.endsWith('/package.json') ||
			/^apps\/api\/(prisma(?:\/|\.config\.)|src\/(auth|common|feature-flags|teams)\/)/.test(
				path,
			)
		)
			return { api: true, web: true, reason: 'shared-or-infrastructure' }
		if (path.startsWith('apps/api/')) api = true
		else if (path.startsWith('apps/web/')) web = true
		else return { api: true, web: true, reason: 'shared-or-infrastructure' }
	}
	return { api, web, reason: api || web ? 'application-changes' : 'docs-or-no-changes' }
}

function changedPaths(base, head, mode) {
	return execFileSync(
		'git',
		[
			'diff',
			'--name-only',
			'--no-renames',
			'-z',
			`${base}${mode === 'range' ? '..' : '...'}${head}`,
		],
		{
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		},
	)
		.split('\0')
		.filter(Boolean)
}

export function createPlan({
	base,
	head,
	full = false,
	mode = 'merge-base',
	readChanges = changedPaths,
}) {
	if (full) return { api: true, web: true, reason: 'full-requested' }
	if (
		!commitPattern.test(base ?? '') ||
		!commitPattern.test(head ?? '') ||
		/^0+$/.test(base)
	) {
		return { api: true, web: true, reason: 'comparison-unavailable' }
	}
	try {
		return classifyChanges(readChanges(base, head, mode))
	} catch {
		return { api: true, web: true, reason: 'comparison-unavailable' }
	}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	const { values } = parseArgs({
		options: {
			base: { type: 'string' },
			head: { type: 'string' },
			full: { type: 'boolean' },
		},
	})
	const plan = createPlan({
		base: values.base ?? process.env.CI_BASE_SHA,
		head: values.head ?? process.env.CI_HEAD_SHA,
		mode: process.env.CI_COMPARE_MODE ?? 'merge-base',
		full: values.full || process.env.CI_FULL === 'true',
	})
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(
			process.env.GITHUB_OUTPUT,
			`api=${plan.api}\nweb=${plan.web}\nreason=${plan.reason}\n`,
		)
	}
	process.stdout.write(`${JSON.stringify(plan)}\n`)
}
