import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Task version migration (isolated PostgreSQL schema)', () => {
	let client: Client
	let schema: string
	beforeEach(async () => {
		client = new Client({ connectionString: process.env.DATABASE_URL })
		await client.connect()
		schema = `task_version_test_${randomUUID().replaceAll('-', '')}`
		await client.query(`CREATE SCHEMA "${schema}"`)
		await client.query(`SET search_path TO "${schema}"`)
		await client.query('CREATE TABLE "Task" (id TEXT PRIMARY KEY, title TEXT NOT NULL)')
	})
	afterEach(async () => {
		try {
			await client.query('ROLLBACK')
			await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
		} finally {
			await client.end()
		}
	})
	it('preserves existing tasks and initializes old and new rows with version zero', async () => {
		await client.query('INSERT INTO "Task" (id, title) VALUES ($1, $2)', [
			'old',
			'Keep this task',
		])
		await client.query(
			readFileSync(
				join(
					process.cwd(),
					'prisma/migrations/20261028010000_add_task_version/migration.sql',
				),
				'utf8',
			),
		)
		await client.query('INSERT INTO "Task" (id, title) VALUES ($1, $2)', [
			'new',
			'New task',
		])
		expect(
			(await client.query('SELECT id, title, version FROM "Task" ORDER BY id')).rows,
		).toEqual([
			{ id: 'new', title: 'New task', version: 0 },
			{ id: 'old', title: 'Keep this task', version: 0 },
		])
		await expect(
			client.query('UPDATE "Task" SET version = NULL WHERE id = $1', ['old']),
		).rejects.toMatchObject({ code: '23502' })
	})
})
