import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { describe, expect, it } from 'vitest'

describe('Task type migration', () => {
	it('preserves existing tasks and defaults old and new tasks to TASK', async () => {
		const client = new Client({ connectionString: process.env.DATABASE_URL })
		const schema = `task_type_test_${randomUUID().replaceAll('-', '')}`
		await client.connect()
		try {
			await client.query(`CREATE SCHEMA "${schema}"`)
			await client.query(`SET search_path TO "${schema}"`)
			await client.query(
				'CREATE TABLE "Task" (id TEXT PRIMARY KEY, title TEXT NOT NULL, "projectId" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)',
			)
			await client.query(
				'INSERT INTO "Task" (id, title, "projectId") VALUES ($1, $2, $3)',
				['old', 'Keep this task', 'project'],
			)
			await client.query(
				readFileSync(
					join(
						process.cwd(),
						'prisma/migrations/20261028020000_add_task_type/migration.sql',
					),
					'utf8',
				),
			)
			await client.query(
				'INSERT INTO "Task" (id, title, "projectId") VALUES ($1, $2, $3)',
				['new', 'New task', 'project'],
			)
			expect(
				(await client.query('SELECT id, title, type FROM "Task" ORDER BY id')).rows,
			).toEqual([
				{ id: 'new', title: 'New task', type: 'TASK' },
				{ id: 'old', title: 'Keep this task', type: 'TASK' },
			])
		} finally {
			try {
				await client.query('ROLLBACK')
				await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
			} finally {
				await client.end()
			}
		}
	})
})
