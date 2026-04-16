import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin } from '../helpers/e2e.helpers'

describe('Invitations (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	let ownerCookies: string
	let adminCookies: string
	let memberCookies: string
	let strangerCookies: string
	let inviteeCookies: string

	let ownerId: string
	let adminId: string
	let memberId: string
	let inviteeId: string

	let teamId: string

	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		server = app.getHttpServer() as Server
		prisma = testApp.prisma
		redisClient = testApp.redisClient
	})

	afterAll(async () => {
		await redisClient.flushall()
		await prisma.$disconnect()
		await app.close()
	})

	beforeEach(async () => {
		await prisma.teamInvitation.deleteMany()
		await prisma.teamMember.deleteMany()
		await prisma.team.deleteMany()
		await prisma.user.deleteMany()
		await redisClient.flushall()

		const ownerAuth = await registerAndLogin(app, 'owner-invite@test.com')
		const adminAuth = await registerAndLogin(app, 'admin-invite@test.com')
		const memberAuth = await registerAndLogin(app, 'member-invite@test.com')
		const strangerAuth = await registerAndLogin(app, 'stranger-invite@test.com')
		const inviteeAuth = await registerAndLogin(app, 'invitee-invite@test.com')

		ownerCookies = ownerAuth.cookies
		adminCookies = adminAuth.cookies
		memberCookies = memberAuth.cookies
		strangerCookies = strangerAuth.cookies
		inviteeCookies = inviteeAuth.cookies

		const createRes = await request(server)
			.post('/teams/new')
			.set('Cookie', ownerCookies)
			.send({ name: 'Invitations Team' })
			.expect(201)

		teamId = createRes.body.id as string

		const [ownerUser, adminUser, memberUser, inviteeUser] = await Promise.all([
			prisma.user.findUnique({ where: { email: 'owner-invite@test.com' } }),
			prisma.user.findUnique({ where: { email: 'admin-invite@test.com' } }),
			prisma.user.findUnique({ where: { email: 'member-invite@test.com' } }),
			prisma.user.findUnique({ where: { email: 'invitee-invite@test.com' } }),
		])

		ownerId = ownerUser!.id
		adminId = adminUser!.id
		memberId = memberUser!.id
		inviteeId = inviteeUser!.id

		await prisma.teamMember.createMany({
			data: [
				{ teamId, userId: adminId, role: 'ADMIN' },
				{ teamId, userId: memberId, role: 'MEMBER' },
			],
		})
	})

	describe('POST /teams/:id/invitations', () => {
		it('должен создавать приглашение для OWNER', async () => {
			const res = await request(server)
				.post(`/teams/${teamId}/invitations`)
				.set('Cookie', ownerCookies)
				.send({ email: 'invitee-invite@test.com', role: 'MEMBER' })
				.expect(201)

			expect(res.body).toMatchObject({
				teamId,
				email: 'invitee-invite@test.com',
				role: 'MEMBER',
				status: 'PENDING',
				token: expect.any(String),
			})
		})

		it('должен возвращать 403 если MEMBER пытается отправить приглашение', async () => {
			await request(server)
				.post(`/teams/${teamId}/invitations`)
				.set('Cookie', memberCookies)
				.send({ email: 'invitee-invite@test.com', role: 'MEMBER' })
				.expect(403)
		})
	})

	describe('GET /teams/:id/invitations', () => {
		it('должен возвращать пагинированный список приглашений для ADMIN', async () => {
			await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-admin-list',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			const res = await request(server)
				.get(`/teams/${teamId}/invitations`)
				.set('Cookie', adminCookies)
				.expect(200)

			expect(res.body.meta).toEqual({
				page: 1,
				limit: 10,
				total: 1,
				totalPages: 1,
			})
			expect(res.body.data).toHaveLength(1)
			expect(res.body.data[0]).toMatchObject({
				teamId,
				email: 'invitee-invite@test.com',
				status: 'PENDING',
			})
		})

		it('должен применять page и limit для списка приглашений', async () => {
			await prisma.teamInvitation.createMany({
				data: [
					{
						teamId,
						invitedById: ownerId,
						email: 'invitee-1@test.com',
						role: 'MEMBER',
						status: 'PENDING',
						token: 'token-admin-list-1',
						expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					},
					{
						teamId,
						invitedById: ownerId,
						email: 'invitee-2@test.com',
						role: 'MEMBER',
						status: 'PENDING',
						token: 'token-admin-list-2',
						expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					},
				],
			})

			const res = await request(server)
				.get(`/teams/${teamId}/invitations?page=2&limit=1`)
				.set('Cookie', adminCookies)
				.expect(200)

			expect(res.body.meta).toEqual({
				page: 2,
				limit: 1,
				total: 2,
				totalPages: 2,
			})
			expect(res.body.data).toHaveLength(1)
		})
	})

	describe('GET /invitations/me', () => {
		it('должен возвращать входящие приглашения текущего пользователя', async () => {
			await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-my-invites',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			const res = await request(server)
				.get('/invitations/me')
				.set('Cookie', inviteeCookies)
				.expect(200)

			expect(res.body).toHaveLength(1)
			expect(res.body[0]).toMatchObject({
				email: 'invitee-invite@test.com',
				team: expect.objectContaining({ id: teamId, name: 'Invitations Team' }),
				invitedBy: expect.objectContaining({ id: ownerId }),
			})
		})
	})

	describe('POST /invitations/:token/accept', () => {
		it('должен принимать приглашение и добавлять пользователя в команду', async () => {
			const invitation = await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-accept',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			const res = await request(server)
				.post(`/invitations/${invitation.token}/accept`)
				.set('Cookie', inviteeCookies)
				.expect(200)

			expect(res.body).toMatchObject({
				id: teamId,
				name: 'Invitations Team',
				members: expect.arrayContaining([
					expect.objectContaining({ userId: inviteeId, role: 'MEMBER' }),
				]),
			})

			const dbInvitation = await prisma.teamInvitation.findUnique({
				where: { id: invitation.id },
			})
			const dbMember = await prisma.teamMember.findUnique({
				where: { teamId_userId: { teamId, userId: inviteeId } },
			})

			expect(dbInvitation?.status).toBe('ACCEPTED')
			expect(dbMember?.role).toBe('MEMBER')
		})
	})

	describe('POST /invitations/:token/decline', () => {
		it('должен отклонять приглашение', async () => {
			const invitation = await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-decline',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			const res = await request(server)
				.post(`/invitations/${invitation.token}/decline`)
				.set('Cookie', inviteeCookies)
				.expect(200)

			expect(res.body).toMatchObject({ id: invitation.id, status: 'DECLINED' })
		})
	})

	describe('DELETE /teams/:id/invitations/:invId', () => {
		it('должен отзывать приглашение для OWNER', async () => {
			const invitation = await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-revoke',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			const res = await request(server)
				.delete(`/teams/${teamId}/invitations/${invitation.id}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toMatchObject({ id: invitation.id, status: 'DECLINED' })
		})

		it('должен возвращать 403 если не участник пытается отозвать приглашение', async () => {
			const invitation = await prisma.teamInvitation.create({
				data: {
					teamId,
					invitedById: ownerId,
					email: 'invitee-invite@test.com',
					role: 'MEMBER',
					status: 'PENDING',
					token: 'token-revoke-forbidden',
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			})

			await request(server)
				.delete(`/teams/${teamId}/invitations/${invitation.id}`)
				.set('Cookie', strangerCookies)
				.expect(403)
		})
	})
})
