import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { FEATURE_KEYS, type BoardColumn, type BoardListItem } from '@repo/types'
import { Prisma } from '../../generated/prisma/client'
import type { Redis } from 'ioredis'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import type { Server } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { defaultBoardData } from '../../src/boards/default-board'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Board columns (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redis: Redis
	let ownerCookies: string
	let adminCookies: string
	let memberCookies: string
	let outsiderCookies: string
	let teamId: string
	let projectId: string
	let foreignProjectId: string
	let ownerId: string
	let defaultBoardId: string

	const path = (boardId: string) => `/boards/${boardId}/columns`
	const columns = (boardId: string) =>
		prisma.boardColumn.findMany({
			where: { boardId },
			orderBy: [{ position: 'asc' }, { id: 'asc' }],
		})

	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		server = app.getHttpServer() as Server
		prisma = testApp.prisma
		redis = testApp.redisClient
		await resetE2eState(prisma, redis)
		ownerCookies = (await registerAndLogin(app, 'columns-owner@example.com')).cookies
		adminCookies = (await registerAndLogin(app, 'columns-admin@example.com')).cookies
		memberCookies = (await registerAndLogin(app, 'columns-member@example.com')).cookies
		outsiderCookies = (await registerAndLogin(app, 'columns-outsider@example.com'))
			.cookies
		const users = await prisma.user.findMany({
			where: { email: { startsWith: 'columns-' } },
		})
		ownerId = users.find((user) => user.email === 'columns-owner@example.com')!.id
		const team = await prisma.team.create({
			data: {
				name: 'Columns team',
				members: {
					create: [
						{ userId: ownerId, role: 'OWNER' },
						{
							userId: users.find((user) => user.email === 'columns-admin@example.com')!
								.id,
							role: 'ADMIN',
						},
						{
							userId: users.find((user) => user.email === 'columns-member@example.com')!
								.id,
							role: 'MEMBER',
						},
					],
				},
			},
		})
		teamId = team.id
		projectId = (
			await prisma.project.create({
				data: {
					name: 'Columns project',
					teamId,
					createdById: ownerId,
				},
			})
		).id
		const foreignTeam = await prisma.team.create({
			data: { name: 'Foreign columns team' },
		})
		foreignProjectId = (
			await prisma.project.create({
				data: {
					name: 'Foreign project',
					teamId: foreignTeam.id,
					createdById: ownerId,
				},
			})
		).id
	})

	beforeEach(async () => {
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.BOARDS },
			data: { enabled: true },
		})
		await prisma.task.deleteMany({
			where: { projectId: { in: [projectId, foreignProjectId] } },
		})
		await prisma.board.deleteMany({
			where: { projectId: { in: [projectId, foreignProjectId] } },
		})
		defaultBoardId = (
			await prisma.board.create({ data: { projectId, ...defaultBoardData() } })
		).id
	})

	afterAll(async () => {
		try {
			if (prisma && redis) await resetE2eState(prisma, redis)
		} finally {
			if (app) await app.close()
			if (prisma) await prisma.$disconnect()
		}
	})

	async function createBoard(name = 'Support') {
		const response = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/boards`)
			.set('Cookie', ownerCookies)
			.send({ name })
			.expect(201)
		return response.body as BoardListItem
	}

	async function createColumn(boardId: string, key = 'CUSTOM', position?: number) {
		const response = await request(server)
			.post(path(boardId))
			.set('Cookie', ownerCookies)
			.send({ key, title: key, ...(position === undefined ? {} : { position }) })
			.expect(201)
		return response.body as BoardColumn
	}

	function createTask(boardColumnId: string, title: string, position: number) {
		return prisma.task.create({
			data: {
				boardColumnId,
				projectId,
				createdById: ownerId,
				assigneeId: ownerId,
				title,
				position,
				description: 'Keep the description',
				priority: 'HIGH',
				status: 'IN_REVIEW',
				dueDate: new Date('2026-12-01T12:00:00Z'),
			},
		})
	}

	async function deleteColumn(
		boardId: string,
		sourceId: string,
		targetId: string,
		status = 204,
	) {
		return request(server)
			.delete(`${path(boardId)}/${sourceId}`)
			.set('Cookie', ownerCookies)
			.send({ targetColumnId: targetId })
			.expect(status)
	}

	it('inserts columns at the beginning, middle and end with dense positions', async () => {
		const board = await createBoard()
		const first = await createColumn(board.id, 'FIRST', 0)
		const middle = await createColumn(board.id, 'MIDDLE', 3)
		const last = await createColumn(board.id, 'LAST')
		const result = await columns(board.id)
		expect(result.map((column) => column.id)).toEqual([
			first.id,
			board.columns[0].id,
			board.columns[1].id,
			middle.id,
			board.columns[2].id,
			board.columns[3].id,
			last.id,
		])
		expect(result.map((column) => column.position)).toEqual([0, 1, 2, 3, 4, 5, 6])
		expect(last).toMatchObject({
			boardId: board.id,
			projectId,
			position: 6,
			isSystem: false,
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		})
	})

	it('allows an admin to create, rename, reorder and delete columns', async () => {
		const board = await createBoard()
		const created = await request(server)
			.post(path(board.id))
			.set('Cookie', adminCookies)
			.send({ key: ' CUSTOM ', title: ' Custom ' })
			.expect(201)
		const column = created.body as BoardColumn
		expect(column).toMatchObject({ key: 'CUSTOM', title: 'Custom' })
		const renamed = await request(server)
			.patch(`${path(board.id)}/${column.id}`)
			.set('Cookie', adminCookies)
			.send({ key: ' RENAMED ', title: ' Renamed ' })
			.expect(200)
		expect(renamed.body).toMatchObject({ key: 'RENAMED', title: 'Renamed', position: 4 })
		const order = [column.id, ...board.columns.map((item) => item.id).reverse()]
		const reordered = await request(server)
			.patch(`${path(board.id)}/reorder`)
			.set('Cookie', adminCookies)
			.send({ columnIds: order })
			.expect(200)
		expect((reordered.body as BoardColumn[]).map((item) => item.id)).toEqual(order)
		expect((reordered.body as BoardColumn[]).map((item) => item.position)).toEqual([
			0, 1, 2, 3, 4,
		])
		await request(server)
			.delete(`${path(board.id)}/${column.id}`)
			.set('Cookie', adminCookies)
			.send({ targetColumnId: board.columns[0].id })
			.expect(204)
		expect((await columns(board.id)).map((item) => item.position)).toEqual([0, 1, 2, 3])
	})

	it.each(['member', 'outsider', 'unauthenticated'])(
		'rejects every mutation by %s without changing data',
		async (role) => {
			const board = await createBoard()
			const cookies =
				role === 'member' ? memberCookies : role === 'outsider' ? outsiderCookies : ''
			const status = cookies ? 403 : 401
			const original = await columns(board.id)
			await request(server)
				.post(path(board.id))
				.set('Cookie', cookies)
				.send({ key: 'DENIED', title: 'Denied' })
				.expect(status)
			await request(server)
				.patch(`${path(board.id)}/${board.columns[0].id}`)
				.set('Cookie', cookies)
				.send({ title: 'Denied' })
				.expect(status)
			await request(server)
				.patch(`${path(board.id)}/reorder`)
				.set('Cookie', cookies)
				.send({ columnIds: board.columns.map((item) => item.id).reverse() })
				.expect(status)
			await request(server)
				.delete(`${path(board.id)}/${board.columns[0].id}`)
				.set('Cookie', cookies)
				.send({ targetColumnId: board.columns[1].id })
				.expect(status)
			expect(await columns(board.id)).toEqual(original)
		},
	)

	it('derives access from the board team and rejects foreign column IDs', async () => {
		const board = await createBoard()
		const other = await createBoard('Other')
		const foreign = await prisma.board.create({
			data: { projectId: foreignProjectId, ...defaultBoardData() },
		})
		await request(server)
			.post(path(foreign.id))
			.set('Cookie', ownerCookies)
			.send({ key: 'DENIED', title: 'Denied' })
			.expect(403)
		await request(server)
			.patch(`${path(board.id)}/${other.columns[0].id}`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Denied' })
			.expect(404)
		await deleteColumn(board.id, other.columns[0].id, board.columns[1].id, 404)
		await deleteColumn(board.id, board.columns[0].id, other.columns[1].id, 404)
		expect(await prisma.boardColumn.count({ where: { boardId: board.id } })).toBe(4)
	})

	it('returns 404 for missing boards and columns on all operations', async () => {
		const board = await createBoard()
		await request(server)
			.post(path('missing'))
			.set('Cookie', ownerCookies)
			.send({ key: 'KEY', title: 'Title' })
			.expect(404)
		await request(server)
			.patch(`${path('missing')}/reorder`)
			.set('Cookie', ownerCookies)
			.send({ columnIds: ['missing'] })
			.expect(404)
		await request(server)
			.patch(`${path(board.id)}/missing`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Title' })
			.expect(404)
		await deleteColumn(board.id, 'missing', board.columns[1].id, 404)
		await deleteColumn(board.id, board.columns[0].id, 'missing', 404)
	})

	it('enforces unique normalized keys and titles within one board, including at database level', async () => {
		const board = await createBoard()
		const original = await columns(board.id)
		for (const body of [
			{ key: ' TODO ', title: 'New' },
			{ key: 'NEW', title: ' К выполнению ' },
		]) {
			await request(server)
				.post(path(board.id))
				.set('Cookie', ownerCookies)
				.send(body)
				.expect(409)
		}
		for (const body of [{ key: 'TODO' }, { title: 'К выполнению' }]) {
			await request(server)
				.patch(`${path(board.id)}/${board.columns[1].id}`)
				.set('Cookie', ownerCookies)
				.send(body)
				.expect(409)
		}
		await expect(
			prisma.boardColumn.create({
				data: {
					boardId: board.id,
					projectId,
					key: 'DIRECT',
					title: 'К выполнению',
					position: 4,
				},
			}),
		).rejects.toMatchObject({ code: 'P2002' })
		expect(await columns(board.id)).toEqual(original)
		await createBoard('Other') // Identical initial titles are valid across boards.
	})

	it.each([
		['post', { key: '', title: 'Title' }],
		['post', { key: 'KEY', title: '  ' }],
		['post', { key: 'x'.repeat(65), title: 'Title' }],
		['post', { key: 'KEY', title: 'x'.repeat(101) }],
		['post', { key: 'KEY', title: 'Title', position: -1 }],
		['post', { key: 'KEY', title: 'Title', position: 1.5 }],
		['post', { key: 'KEY', title: 'Title', position: 5 }],
		['post', { key: 'KEY', title: 'Title', isSystem: true }],
		['patch', {}],
		['patch', { position: 0 }],
		['patch', { boardId: 'foreign', title: 'Title' }],
		['delete', {}],
		['delete', { targetColumnId: '' }],
		['delete', { targetColumnId: 'id', force: true }],
	] as const)('rejects invalid %s payload %j without writes', async (method, body) => {
		const board = await createBoard()
		const original = await columns(board.id)
		const endpoint =
			method === 'post' ? path(board.id) : `${path(board.id)}/${board.columns[0].id}`
		await request(server)
			[method](endpoint)
			.set('Cookie', ownerCookies)
			.send(body)
			.expect(400)
		expect(await columns(board.id)).toEqual(original)
	})

	it('accepts only a complete permutation of columns from the same board', async () => {
		const board = await createBoard()
		const other = await createBoard('Other')
		const ids = board.columns.map((column) => column.id)
		const original = await columns(board.id)
		for (const columnIds of [
			[],
			ids.slice(1),
			[...ids, ids[0]],
			[ids[0], ids[0], ids[2], ids[3]],
			[...ids.slice(0, 3), other.columns[0].id],
			[...ids, 'missing'],
		]) {
			await request(server)
				.patch(`${path(board.id)}/reorder`)
				.set('Cookie', ownerCookies)
				.send({ columnIds })
				.expect(400)
		}
		expect(await columns(board.id)).toEqual(original)
	})

	it('normalizes existing sparse and negative positions without unique-index conflicts', async () => {
		const board = await createBoard()
		for (const [index, column] of board.columns.entries()) {
			await prisma.boardColumn.update({
				where: { id: column.id },
				data: { position: [-1, -2, 2147483647, 100][index] },
			})
		}
		const ids = board.columns.map((column) => column.id).reverse()
		await request(server)
			.patch(`${path(board.id)}/reorder`)
			.set('Cookie', ownerCookies)
			.send({ columnIds: ids })
			.expect(200)
		expect(
			(await columns(board.id)).map((column) => [column.id, column.position]),
		).toEqual(ids.map((id, index) => [id, index]))
	})

	it('protects system keys and deletion while allowing titles and legacy task creation', async () => {
		const initial = await columns(defaultBoardId)
		await request(server)
			.patch(`${path(defaultBoardId)}/${initial[0].id}`)
			.set('Cookie', ownerCookies)
			.send({ key: 'OTHER' })
			.expect(409)
		await deleteColumn(defaultBoardId, initial[0].id, initial[1].id, 409)
		await request(server)
			.patch(`${path(defaultBoardId)}/${initial[0].id}`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Ожидает работы', key: 'TODO' })
			.expect(200)
		const response = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Legacy task', status: 'TODO' })
			.expect(201)
		expect(
			await prisma.task.findUniqueOrThrow({
				where: { id: (response.body as { id: string }).id },
			}),
		).toMatchObject({ boardColumnId: initial[0].id, status: 'TODO' })
	})

	it('rejects self transfer and deletion of the last column', async () => {
		const board = await createBoard()
		await deleteColumn(board.id, board.columns[0].id, board.columns[0].id, 400)
		for (const column of board.columns.slice(0, 3)) {
			await deleteColumn(board.id, column.id, board.columns[3].id)
		}
		await deleteColumn(board.id, board.columns[3].id, board.columns[3].id, 409)
		expect(await columns(board.id)).toMatchObject([
			{ id: board.columns[3].id, position: 0 },
		])
	})

	it('appends all source tasks in stable order and preserves their data when deleting a column', async () => {
		const board = await createBoard()
		const [source, target] = board.columns
		const existing = await createTask(target.id, 'Existing', 8)
		const moved = await Promise.all([
			createTask(source.id, 'Later', 9),
			createTask(source.id, 'First', 1),
			createTask(source.id, 'Tied', 1),
		])
		moved.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
		await deleteColumn(board.id, source.id, target.id)
		expect(await prisma.boardColumn.findUnique({ where: { id: source.id } })).toBeNull()
		expect((await columns(board.id)).map((column) => column.position)).toEqual([0, 1, 2])
		expect(await prisma.task.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(
			existing,
		)
		const tasks = await prisma.task.findMany({
			where: { boardColumnId: target.id },
			orderBy: { position: 'asc' },
		})
		expect(tasks.map((task) => task.id)).toEqual([
			existing.id,
			...moved.map((task) => task.id),
		])
		for (const [index, original] of moved.entries()) {
			expect(tasks[index + 1]).toEqual({
				...original,
				boardColumnId: target.id,
				position: 9 + index,
				updatedAt: expect.any(Date),
			})
		}
		expect(await prisma.task.count({ where: { projectId } })).toBe(4)
	})

	it('transfers tasks across bulk-update batches without losing order or rows', async () => {
		const board = await createBoard()
		const [source, target] = board.columns
		await prisma.task.createMany({
			data: Array.from({ length: 501 }, (_, position) => ({
				title: `Task ${position}`,
				projectId,
				createdById: ownerId,
				boardColumnId: source.id,
				position,
			})),
		})
		await deleteColumn(board.id, source.id, target.id)
		const tasks = await prisma.task.findMany({
			where: { boardColumnId: target.id },
			orderBy: { position: 'asc' },
		})
		expect(tasks).toHaveLength(501)
		expect(tasks.map((task) => [task.title, task.position])).toEqual(
			Array.from({ length: 501 }, (_, position) => [`Task ${position}`, position]),
		)
	})

	it('starts at zero in an empty target and synchronizes the legacy status for system targets', async () => {
		const source = await createColumn(defaultBoardId)
		const target = (await columns(defaultBoardId)).find(
			(column) => column.key === 'DONE',
		)!
		const task = await createTask(source.id, 'Complete', 7)
		await deleteColumn(defaultBoardId, source.id, target.id)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: target.id, status: 'DONE', position: 0 },
		)
	})

	it('rolls back deletion when task positions would overflow int32', async () => {
		const board = await createBoard()
		const original = await columns(board.id)
		const sourceTask = await createTask(board.columns[0].id, 'Source', 1)
		const targetTask = await createTask(board.columns[1].id, 'Full', 2147483647)
		await deleteColumn(board.id, board.columns[0].id, board.columns[1].id, 409)
		expect(await columns(board.id)).toEqual(original)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: sourceTask.id } })).toEqual(
			sourceTask,
		)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: targetTask.id } })).toEqual(
			targetTask,
		)
	})

	it('serializes concurrent inserts and preserves a dense order', async () => {
		const board = await createBoard()
		await Promise.all(
			['FIRST', 'SECOND', 'THIRD'].map((key) => createColumn(board.id, key, 0)),
		)
		const result = await columns(board.id)
		expect(result).toHaveLength(7)
		expect(result.map((column) => column.position)).toEqual([0, 1, 2, 3, 4, 5, 6])
		expect(new Set(result.slice(0, 3).map((column) => column.key))).toEqual(
			new Set(['FIRST', 'SECOND', 'THIRD']),
		)
	})

	it('allows only one of concurrent deletions of two remaining columns', async () => {
		const board = await createBoard()
		await deleteColumn(board.id, board.columns[0].id, board.columns[2].id)
		await deleteColumn(board.id, board.columns[1].id, board.columns[2].id)
		const responses = await Promise.all([
			request(server)
				.delete(`${path(board.id)}/${board.columns[2].id}`)
				.set('Cookie', ownerCookies)
				.send({ targetColumnId: board.columns[3].id }),
			request(server)
				.delete(`${path(board.id)}/${board.columns[3].id}`)
				.set('Cookie', ownerCookies)
				.send({ targetColumnId: board.columns[2].id }),
		])
		expect(responses.map((response) => response.status).sort()).toEqual([204, 409])
		expect(await columns(board.id)).toMatchObject([{ position: 0 }])
	})

	function deferred<T>() {
		let resolve!: (value: T) => void
		const promise = new Promise<T>((done) => {
			resolve = done
		})
		return { promise, resolve }
	}

	async function waitForTaskLock(blockerPid: number) {
		const deadline = Date.now() + 5000
		while (Date.now() < deadline) {
			const blocked = await prisma.$queryRaw<{ blocked: boolean }[]>(Prisma.sql`
				SELECT EXISTS(SELECT 1 FROM pg_stat_activity
					WHERE ${blockerPid}::integer = ANY(pg_blocking_pids(pid))
					AND query LIKE '%FROM "Task"%FOR UPDATE%') AS blocked
			`)
			if (blocked[0].blocked) return
			await setTimeout(10)
		}
		throw new Error('Column deletion did not wait for the task lock')
	}

	it('does not move back a task that leaves the source while deletion waits for its lock', async () => {
		const board = await createBoard()
		const source = board.columns[0]
		const target = board.columns[1]
		const escaped = (await columns(defaultBoardId)).find(
			(column) => column.key === 'DONE',
		)!
		const task = await createTask(source.id, 'Moving out', 1)
		const ready = deferred<number>()
		const release = deferred<void>()
		const writer = prisma.$transaction(
			async (tx) => {
				await tx.task.update({
					where: { id: task.id },
					data: { boardColumnId: escaped.id, status: 'DONE', position: 5 },
				})
				const [row] = await tx.$queryRaw<
					{ pid: number }[]
				>`SELECT pg_backend_pid() AS pid`
				ready.resolve(row.pid)
				await release.promise
			},
			{ timeout: 10_000 },
		)
		const pid = await ready.promise
		const deletion = request(server)
			.delete(`${path(board.id)}/${source.id}`)
			.set('Cookie', ownerCookies)
			.send({ targetColumnId: target.id })
			.then((response) => response)
		try {
			await waitForTaskLock(pid)
		} finally {
			release.resolve()
		}
		await writer
		expect((await deletion).status).toBe(204)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: escaped.id, status: 'DONE', position: 5 },
		)
	})

	it('uses current task positions after waiting for a concurrent edit', async () => {
		const board = await createBoard()
		const [source, target] = board.columns
		const first = await createTask(source.id, 'Initially first', 1)
		const second = await createTask(source.id, 'Now first', 9)
		const ready = deferred<number>()
		const release = deferred<void>()
		const writer = prisma.$transaction(
			async (tx) => {
				await tx.task.update({ where: { id: first.id }, data: { position: 100 } })
				const [row] = await tx.$queryRaw<
					{ pid: number }[]
				>`SELECT pg_backend_pid() AS pid`
				ready.resolve(row.pid)
				await release.promise
			},
			{ timeout: 10_000 },
		)
		const pid = await ready.promise
		const deletion = request(server)
			.delete(`${path(board.id)}/${source.id}`)
			.set('Cookie', ownerCookies)
			.send({ targetColumnId: target.id })
			.then((response) => response)
		try {
			await waitForTaskLock(pid)
		} finally {
			release.resolve()
		}
		await writer
		expect((await deletion).status).toBe(204)
		const tasks = await prisma.task.findMany({
			where: { boardColumnId: target.id },
			orderBy: { position: 'asc' },
		})
		expect(tasks.map((task) => task.id)).toEqual([second.id, first.id])
	})

	it('rolls back the whole transfer when a late task arrives after the source snapshot', async () => {
		const board = await createBoard()
		const [source, target] = board.columns
		const originalColumns = await columns(board.id)
		const task = await createTask(source.id, 'Original', 2)
		const targetTask = await createTask(target.id, 'Target', 8)
		const ready = deferred<number>()
		const release = deferred<void>()
		const writer = prisma.$transaction(
			async (tx) => {
				await tx.task.update({
					where: { id: task.id },
					data: { title: 'Concurrent edit' },
				})
				const [row] = await tx.$queryRaw<
					{ pid: number }[]
				>`SELECT pg_backend_pid() AS pid`
				ready.resolve(row.pid)
				await release.promise
			},
			{ timeout: 10_000 },
		)
		const pid = await ready.promise
		const deletion = request(server)
			.delete(`${path(board.id)}/${source.id}`)
			.set('Cookie', ownerCookies)
			.send({ targetColumnId: target.id })
			.then((response) => response)
		let lateTask: Awaited<ReturnType<typeof createTask>>
		try {
			await waitForTaskLock(pid)
			lateTask = await createTask(source.id, 'Late arrival', 3)
		} finally {
			release.resolve()
		}
		await writer
		expect((await deletion).status).toBe(409)
		expect(await columns(board.id)).toEqual(originalColumns)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ title: 'Concurrent edit', boardColumnId: source.id, position: 2 },
		)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: lateTask!.id } })).toEqual(
			lateTask!,
		)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: targetTask.id } })).toEqual(
			targetTask,
		)
	})

	it('blocks every column endpoint when its guard denies access', async () => {
		const board = await createBoard()
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.BOARDS },
			data: { enabled: false },
		})
		await request(server)
			.post(path(board.id))
			.set('Cookie', ownerCookies)
			.send({ key: 'KEY', title: 'Title' })
			.expect(403)
		await request(server)
			.patch(`${path(board.id)}/${board.columns[0].id}`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Title' })
			.expect(403)
		await request(server)
			.patch(`${path(board.id)}/reorder`)
			.set('Cookie', ownerCookies)
			.send({ columnIds: board.columns.map((column) => column.id) })
			.expect(403)
		await deleteColumn(board.id, board.columns[0].id, board.columns[1].id, 403)
	})

	it('publishes all column routes and shared request/response schemas in Swagger', () => {
		const document = cleanupOpenApiDoc(
			SwaggerModule.createDocument(
				app,
				new DocumentBuilder().setTitle('Columns').setVersion('1').build(),
			),
		)
		expect(
			document.paths['/boards/{boardId}/columns'].post?.responses['201'],
		).toBeDefined()
		expect(document.paths['/boards/{boardId}/columns/reorder'].patch).toBeDefined()
		expect(document.paths['/boards/{boardId}/columns/{columnId}'].patch).toBeDefined()
		expect(
			document.paths['/boards/{boardId}/columns/{columnId}'].delete?.responses['204'],
		).toBeDefined()
		expect(document.components?.schemas?.DeleteColumnDto).toMatchObject({
			required: ['targetColumnId'],
			additionalProperties: false,
		})
		expect(document.components?.schemas?.CreateColumnDto).toMatchObject({
			required: ['key', 'title'],
			additionalProperties: false,
		})
	})
})
