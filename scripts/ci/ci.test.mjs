import assert from 'node:assert/strict'
import { test } from 'node:test'

import { checksPassed } from './gate.mjs'
import { classifyChanges, createPlan } from './plan.mjs'
import { resolveRelease } from './release.mjs'

const sha = 'a'.repeat(40)
const base = 'b'.repeat(40)

for (const [paths, expected] of [
	[
		['docs/infra/README.md', 'README.md'],
		[false, false],
	],
	[['apps/api/src/tasks/tasks.service.ts'], [true, false]],
	[['apps/web/views/tasks/page.tsx'], [false, true]],
	[
		['apps/api/removed.ts', 'apps/web/renamed.ts'],
		[true, true],
	],
	[
		['apps/api/removed.ts', 'docs/renamed.md'],
		[true, false],
	],
	[
		['apps/api/README.md', 'apps/web/views/task.tsx'],
		[false, true],
	],
	[[], [false, false]],
])
	test(`selects applications for ${JSON.stringify(paths)}`, () => {
		const plan = classifyChanges(paths)
		assert.deepEqual([plan.api, plan.web], expected)
	})

for (const path of [
	'packages/types/src/entry.ts',
	'packages/ui/src/index.ts',
	'pnpm-lock.yaml',
	'package.json',
	'apps/api/package.json',
	'apps/web/package.json',
	'turbo.json',
	'.github/workflows/ci.yml',
	'scripts/ci/plan.mjs',
	'apps/api/prisma/migrations/new/migration.sql',
	'apps/api/prisma.config.ts',
	'apps/api/prisma.config.mjs',
	'apps/api/src/auth/auth.service.ts',
	'apps/api/src/common/guards/auth.guard.ts',
	'apps/api/src/teams/team-members.service.ts',
	'unknown-config.toml',
])
	test(`runs both applications for ${path}`, () => {
		assert.deepEqual(classifyChanges([path]), {
			api: true,
			web: true,
			reason: 'shared-or-infrastructure',
		})
	})

test('full release or manual check cannot be narrowed by the changed paths', () => {
	assert.deepEqual(
		createPlan({
			full: true,
			readChanges: () => {
				throw new Error('Should not run')
			},
		}),
		{ api: true, web: true, reason: 'full-requested' },
	)
})

test('uses the complete PR comparison base and head', () => {
	assert.equal(
		createPlan({
			base,
			head: sha,
			readChanges: (actualBase, actualHead) => {
				assert.equal(actualBase, base)
				assert.equal(actualHead, sha)
				return ['apps/api/src/tasks/tasks.service.ts']
			},
		}).api,
		true,
	)
})

test('push comparisons include the complete before/after range', () => {
	createPlan({
		base,
		head: sha,
		mode: 'range',
		readChanges: (actualBase, actualHead, mode) => {
			assert.equal(actualBase, base)
			assert.equal(actualHead, sha)
			assert.equal(mode, 'range')
			return ['apps/api/deleted.ts']
		},
	})
})

test('the final gate accepts only successful selected checks or a confirmed docs-only skip', () => {
	assert.equal(
		checksPassed({ plan: 'success', checks: 'success', api: 'true', web: 'false' }),
		true,
	)
	assert.equal(
		checksPassed({ plan: 'success', checks: 'skipped', api: 'false', web: 'false' }),
		true,
	)
	for (const checks of ['skipped', 'cancelled', 'failure', '', undefined]) {
		assert.equal(
			checksPassed({ plan: 'success', checks, api: 'true', web: 'true' }),
			false,
		)
	}
	for (const plan of ['failure', 'cancelled', 'skipped', undefined]) {
		assert.equal(
			checksPassed({ plan, checks: 'skipped', api: 'false', web: 'false' }),
			false,
		)
	}
	assert.equal(
		checksPassed({ plan: 'success', checks: 'skipped', api: '', web: '' }),
		false,
	)
})

for (const invalidBase of [undefined, '', '0'.repeat(40), 'missing-branch']) {
	test(`missing comparison ${invalidBase} defaults to a full run`, () => {
		assert.deepEqual(createPlan({ base: invalidBase, head: sha }), {
			api: true,
			web: true,
			reason: 'comparison-unavailable',
		})
	})
}

test('unavailable Git history cannot silently skip checks', () => {
	assert.deepEqual(
		createPlan({
			base,
			head: sha,
			readChanges: () => {
				throw new Error('Missing history')
			},
		}),
		{ api: true, web: true, reason: 'comparison-unavailable' },
	)
})

for (const tag of ['v1.2.3', 'v1.2.3-rc.1'])
	test(`pins release ${tag} to the exact tag commit`, () => {
		assert.deepEqual(
			resolveRelease({
				tag,
				expectedSha: sha,
				resolveTag: (actualTag) => {
					assert.equal(actualTag, tag)
					return sha
				},
			}),
			{ tag, sha, image_tag: `release-${tag}-sha-aaaaaaa` },
		)
	})

for (const tag of [
	undefined,
	'',
	'main',
	'refs/heads/main',
	'v1.2',
	'v1.2.3\nsha=bad',
	'v1.2.3;echo bad',
]) {
	test(`rejects a non-release ref ${JSON.stringify(tag)} before invoking Git`, () => {
		assert.throws(() =>
			resolveRelease({ tag, resolveTag: () => assert.fail('Git must not run') }),
		)
	})
}

test('refuses a tag moved after publication', () => {
	assert.throws(
		() => resolveRelease({ tag: 'v1.2.3', expectedSha: base, resolveTag: () => sha }),
		/Тег больше/,
	)
})

test('a missing tag or invalid resolved commit blocks publication', () => {
	assert.throws(
		() =>
			resolveRelease({
				tag: 'v1.2.3',
				resolveTag: () => {
					throw new Error('No tag')
				},
			}),
		/No tag/,
	)
	assert.throws(
		() => resolveRelease({ tag: 'v1.2.3', resolveTag: () => 'main' }),
		/коммит/,
	)
})
