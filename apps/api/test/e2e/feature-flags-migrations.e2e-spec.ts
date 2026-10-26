import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const migration = (name: string) =>
	readFileSync(join(process.cwd(), 'prisma/migrations', name, 'migration.sql'), 'utf8')
const simplify = migration('20261026000000_simplify_feature_flags')
const removeTestFlag = migration('20261026010000_remove_unused_test_flag')

describe('Feature flag data migrations (isolated PostgreSQL schemas)', () => {
	let client: Client
	let schema: string
	beforeEach(async () => {
		client = new Client({ connectionString: process.env.DATABASE_URL })
		await client.connect()
		schema = 'feature_flags_test_' + process.pid + '_' + Date.now()
		await client.query('CREATE SCHEMA "' + schema + '"')
		await client.query('SET search_path TO "' + schema + '"')
		await client.query(migration('20261010000000_add_runtime_feature_flags'))
		await client.query(migration('20261011190000_enable_backlog_menu_flag'))
	})
	afterEach(async () => {
		// В случае ошибки миграции сначала выходим из прерванной транзакции.
		await client.query('ROLLBACK')
		await client.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE')
		await client.end()
	})
	it('creates the five release flags disabled and keeps the database default disabled', async () => {
		await client.query(simplify)
		const initial = await client.query(
			'SELECT key, enabled FROM "FeatureFlag" ORDER BY key',
		)
		expect(initial.rows.map((row) => row.key)).toEqual([
			'backlog',
			'boards',
			'projects',
			'tasks',
			'team-settings',
		])
		expect(initial.rows.every((row) => row.enabled === false)).toBe(true)
		await client.query(
			'INSERT INTO "FeatureFlag" ("id", "key", "updatedAt") VALUES (\'new\', \'next-release\', CURRENT_TIMESTAMP)',
		)
		expect(
			(
				await client.query(
					'SELECT enabled FROM "FeatureFlag" WHERE key = \'next-release\'',
				)
			).rows[0].enabled,
		).toBe(false)
		const columns = await client.query(
			"SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'FeatureFlag' ORDER BY column_name",
			[schema],
		)
		expect(columns.rows.map((row) => row.column_name)).toEqual([
			'enabled',
			'id',
			'key',
			'updatedAt',
		])
		expect(
			(await client.query('SELECT to_regclass(\'"FeatureFlagAudit"\') AS audit')).rows[0]
				.audit,
		).toBeNull()
	})
	it('preserves existing records and states, keeps archives off, and advances the revision', async () => {
		await client.query(
			"UPDATE \"FeatureFlag\" SET enabled = true WHERE key IN ('boards', 'tasks')",
		)
		await client.query(
			'UPDATE "FeatureFlag" SET "archivedAt" = CURRENT_TIMESTAMP WHERE key = \'tasks\'',
		)
		await client.query(
			'INSERT INTO "FeatureFlag" ("id", "key", "title", "enabled", "createdById", "updatedAt") VALUES (\'old\', \'unconnected\', \'Old flag\', true, \'bootstrap\', CURRENT_TIMESTAMP)',
		)
		const before = (
			await client.query(
				'SELECT version FROM "FeatureFlagsRevision" WHERE id = \'global\'',
			)
		).rows[0].version as number
		await client.query(simplify)
		const states = Object.fromEntries(
			(await client.query('SELECT key, enabled FROM "FeatureFlag"')).rows.map((row) => [
				row.key,
				row.enabled,
			]),
		)
		expect(states).toMatchObject({
			boards: true,
			tasks: false,
			projects: false,
			unconnected: true,
		})
		expect(
			(
				await client.query(
					'SELECT version FROM "FeatureFlagsRevision" WHERE id = \'global\'',
				)
			).rows[0].version,
		).toBe(before + 1)
	})
	it('removes only the unused test flag, preserves other states and advances the version on deletion', async () => {
		await client.query(simplify)
		await client.query('UPDATE "FeatureFlag" SET enabled = true WHERE key = \'boards\'')
		const before = await client.query(
			'SELECT key, enabled FROM "FeatureFlag" ORDER BY key',
		)
		await client.query(
			'INSERT INTO "FeatureFlag" ("id", "key", "enabled", "updatedAt") VALUES (\'test\', \'test-flag\', true, CURRENT_TIMESTAMP)',
		)
		const version = (
			await client.query(
				'SELECT version FROM "FeatureFlagsRevision" WHERE id = \'global\'',
			)
		).rows[0].version as number
		await client.query(removeTestFlag)
		expect(
			(await client.query('SELECT key, enabled FROM "FeatureFlag" ORDER BY key')).rows,
		).toEqual(before.rows)
		expect(
			(
				await client.query(
					'SELECT version FROM "FeatureFlagsRevision" WHERE id = \'global\'',
				)
			).rows[0].version,
		).toBe(version + 1)
		await client.query(removeTestFlag)
		expect(
			(
				await client.query(
					'SELECT version FROM "FeatureFlagsRevision" WHERE id = \'global\'',
				)
			).rows[0].version,
		).toBe(version + 1)
	})
})
