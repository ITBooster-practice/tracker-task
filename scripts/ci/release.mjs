import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const tagPattern =
	/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-z\d]+(?:[.-][a-z\d]+)*)?$/i
const commitPattern = /^[a-f\d]{40}(?:[a-f\d]{24})?$/i

function readTagCommit(tag) {
	return execFileSync('git', ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim()
}

export function resolveRelease({ tag, expectedSha, resolveTag = readTagCommit }) {
	if (!tagPattern.test(tag ?? ''))
		throw new Error('Укажите релизный тег вида v1.2.3 или v1.2.3-rc.1')
	const sha = resolveTag(tag)
	if (!commitPattern.test(sha))
		throw new Error('Не удалось определить коммит релизного тега')
	if (expectedSha && sha !== expectedSha)
		throw new Error('Тег больше не указывает на коммит опубликованного релиза')
	const imageTag = `release-${tag}-sha-${sha.slice(0, 7)}`
	if (imageTag.length > 128) throw new Error('Релизный тег слишком длинный для Docker')
	return { tag, sha, image_tag: imageTag }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	const { values } = parseArgs({
		options: { tag: { type: 'string' }, 'expected-sha': { type: 'string' } },
	})
	const release = resolveRelease({
		tag: values.tag ?? process.env.RELEASE_TAG,
		expectedSha: values['expected-sha'] ?? process.env.RELEASE_EVENT_SHA,
	})
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(
			process.env.GITHUB_OUTPUT,
			Object.entries(release)
				.map(([key, value]) => `${key}=${value}\n`)
				.join(''),
		)
	}
	process.stdout.write(`${JSON.stringify(release)}\n`)
}
