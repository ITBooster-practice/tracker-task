import { randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const migrationsPath = join(process.cwd(), 'prisma/migrations')
const migrationSql = (name: string) =>
	readFileSync(join(migrationsPath, name, 'migration.sql'), 'utf8')
const backfill = migrationSql('20261027010000_backfill_task_board_columns')
const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

describe('Board data migration (isolated PostgreSQL schemas)', () => {
	let client: Client
	let schema: string

	beforeEach(async () => {
		client = new Client({ connectionString: process.env.DATABASE_URL })
		await client.connect()
		schema = `board_migration_${randomUUID().replaceAll('-', '')}`
		await client.query(`CREATE SCHEMA "${schema}"`)
		await client.query(`SET search_path TO "${schema}"`)
		for (const name of readdirSync(migrationsPath).sort()) {
			if (
				/^\d{14}(?:_|$)/.test(name) &&
				name <= '20261027000000_add_boards_and_columns'
			) {
				await client.query(migrationSql(name))
			}
		}
		// Existing user data, not seed/reset. Both populated and empty projects.
		await client.query(`
			INSERT INTO "User" (id, email, password, "updatedAt")
			VALUES ('author', 'legacy@example.com', 'password-hash', '2026-01-02');
			INSERT INTO "Team" (id, name, "updatedAt") VALUES ('team', 'Legacy team', '2026-01-02');
			INSERT INTO "Project" (id, name, description, "teamId", "createdById", "updatedAt")
			SELECT id, id, 'Existing project', 'team', 'author', '2026-01-02'
			FROM (VALUES ('alpha'), ('beta'), ('empty')) AS projects(id);
			INSERT INTO "Task"
				(id, title, description, status, priority, position, "dueDate", "projectId",
				 "assigneeId", "createdById", "createdAt", "updatedAt")
			SELECT project.id || '-' || status::text || '-' || n, 'Existing task',
				'Keep this description', status, 'CRITICAL', n * 7,
				'2026-02-03', project.id, 'author', 'author', '2026-01-01', '2026-01-02'
			FROM (VALUES ('alpha'), ('beta')) AS project(id)
			CROSS JOIN unnest(enum_range(NULL::"TaskStatus")) AS status
			CROSS JOIN generate_series(0, 1) AS n;
		`)
	})

	afterEach(async () => {
		try {
			await client.query('ROLLBACK')
			await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
		} finally {
			await client.end()
		}
	})

	async function records(
		table: 'Task' | 'Board' | 'BoardColumn' | 'Project' | 'Team' | 'User',
	) {
		return (
			await client.query<{ data: unknown }>(
				`SELECT to_jsonb(t) AS data FROM "${table}" AS t ORDER BY id`,
			)
		).rows
	}

	async function legacyTasks() {
		return (
			await client.query<{ data: unknown }>(
				`SELECT to_jsonb(task) - 'boardColumnId' AS data FROM "Task" AS task ORDER BY id`,
			)
		).rows
	}

	it('backfills every status and empty projects without changing any existing user data', async () => {
		const before = await legacyTasks()
		const otherData = await Promise.all([
			records('Project'),
			records('Team'),
			records('User'),
		])
		await client.query(backfill)
		expect(await legacyTasks()).toEqual(before)
		expect(
			await Promise.all([records('Project'), records('Team'), records('User')]),
		).toEqual(otherData)
		const boards = await client.query<{ projectId: string; isDefault: boolean }>(
			'SELECT "projectId", "isDefault" FROM "Board" ORDER BY "projectId"',
		)
		expect(boards.rows).toEqual(
			['alpha', 'beta', 'empty'].map((projectId) => ({ projectId, isDefault: true })),
		)
		for (const projectId of ['alpha', 'beta', 'empty']) {
			const columns = await client.query<{
				key: string
				position: number
				isSystem: boolean
			}>(
				'SELECT key, position, "isSystem" FROM "BoardColumn" WHERE "projectId" = $1 ORDER BY position',
				[projectId],
			)
			expect(columns.rows).toEqual(
				statuses.map((key, position) => ({ key, position, isSystem: true })),
			)
		}
		const mapping = await client.query<{ matches: boolean }>(`
			SELECT task.status::text = col.key AND task."projectId" = col."projectId" AS matches
			FROM "Task" task JOIN "BoardColumn" col ON col.id = task."boardColumnId"
		`)
		expect(mapping.rows).toHaveLength(16)
		expect(mapping.rows.every((row) => row.matches)).toBe(true)
	})

	it('can run again without duplicating boards or columns or changing tasks', async () => {
		await client.query(backfill)
		const before = await Promise.all([
			records('Task'),
			records('Board'),
			records('BoardColumn'),
		])
		await client.query(backfill)
		expect(
			await Promise.all([records('Task'), records('Board'), records('BoardColumn')]),
		).toEqual(before)
	})

	it('preserves existing boards, custom column data and already assigned tasks', async () => {
		await client.query(`
			INSERT INTO "Board" (id, "projectId", name, "isDefault", "updatedAt") VALUES
				('custom', 'alpha', 'Основная доска', false, '2026-01-02'),
				('default', 'beta', 'Existing default', true, '2026-01-02');
			INSERT INTO "BoardColumn" (id, "boardId", "projectId", key, title, position, "isSystem", "updatedAt") VALUES
				('custom-todo', 'custom', 'alpha', 'TODO', 'User title', 9, false, '2026-01-02'),
				('system-todo', 'default', 'beta', 'TODO', 'Renamed TODO', 7, true, '2026-01-02'),
				('custom-stage', 'default', 'beta', 'CUSTOM', 'User stage', 2, false, '2026-01-02');
			UPDATE "Task" SET "boardColumnId" = 'custom-todo' WHERE id = 'alpha-DONE-0';
		`)
		const boards = await records('Board')
		const columns = await records('BoardColumn')
		const tasks = await legacyTasks()
		await client.query(backfill)
		expect(await records('Board')).toEqual(expect.arrayContaining(boards))
		expect(await records('BoardColumn')).toEqual(expect.arrayContaining(columns))
		expect(await legacyTasks()).toEqual(tasks)
		expect(
			(
				await client.query<{ boardColumnId: string }>(
					`SELECT "boardColumnId" FROM "Task" WHERE id = 'alpha-DONE-0'`,
				)
			).rows[0].boardColumnId,
		).toBe('custom-todo')
		expect(
			(
				await client.query<{ name: string }>(
					`SELECT name FROM "Board" WHERE "projectId" = 'alpha' AND "isDefault"`,
				)
			).rows[0].name,
		).toBe('Основная доска (1)')
	})

	it.each(['multiple-defaults', 'reserved-custom-key'])(
		'rolls back completely on inconsistent existing boards: %s',
		async (conflict) => {
			await client.query(`
				INSERT INTO "Board" (id, "projectId", name, "isDefault", "updatedAt")
				VALUES ('default', 'beta', 'Existing default', true, '2026-01-02');
			`)
			if (conflict === 'multiple-defaults') {
				await client.query(`INSERT INTO "Board" (id, "projectId", name, "isDefault", "updatedAt")
					VALUES ('second-default', 'beta', 'Second default', true, '2026-01-02')`)
			} else {
				await client.query(`INSERT INTO "BoardColumn"
					(id, "boardId", "projectId", key, title, position, "isSystem", "updatedAt")
					VALUES ('custom-todo', 'default', 'beta', 'TODO', 'Custom', 0, false, '2026-01-02')`)
			}
			const before = await Promise.all([
				records('Task'),
				records('Board'),
				records('BoardColumn'),
			])
			await expect(client.query(backfill)).rejects.toMatchObject({ code: 'P0001' })
			await client.query('ROLLBACK')
			expect(
				await Promise.all([records('Task'), records('Board'), records('BoardColumn')]),
			).toEqual(before)
			const nullable = await client.query<{ is_nullable: string }>(
				`SELECT is_nullable FROM information_schema.columns
				 WHERE table_schema = $1 AND table_name = 'Task' AND column_name = 'boardColumnId'`,
				[schema],
			)
			expect(nullable.rows[0].is_nullable).toBe('YES')
		},
	)

	it('rejects missing, dangling and foreign-project columns after contract', async () => {
		await client.query(backfill)
		const insert = `INSERT INTO "Task" (id, title, "projectId", "createdById", "updatedAt", "boardColumnId")
			VALUES ('invalid', 'Invalid task', 'alpha', 'author', CURRENT_TIMESTAMP, $1)`
		await expect(client.query(insert, [null])).rejects.toMatchObject({ code: '23502' })
		await expect(client.query(insert, ['missing-column'])).rejects.toMatchObject({
			code: '23503',
		})
		const foreign = await client.query<{ id: string }>(
			`SELECT id FROM "BoardColumn" WHERE "projectId" = 'beta' LIMIT 1`,
		)
		await expect(client.query(insert, [foreign.rows[0].id])).rejects.toMatchObject({
			code: '23503',
		})
	})

	it('also migrates a database with no projects or tasks', async () => {
		await client.query('DELETE FROM "Project"')
		await client.query(backfill)
		expect(await records('Board')).toEqual([])
		expect(await records('BoardColumn')).toEqual([])
	})
})
