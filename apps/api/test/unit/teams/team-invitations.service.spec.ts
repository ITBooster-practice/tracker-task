import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	GoneException,
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamInvitationsService } from '../../../src/teams/invitations/team-invitations.service'
import {
	createInvitationMailMock,
	createInvitationsPrismaMock,
	INVITATION_ID,
	INVITATION_TOKEN,
	INVITED_EMAIL,
	INVITER,
	PENDING_INVITATION,
	TEAM,
	TEAM_WITH_MEMBERS,
} from '../../helpers/invitations.helpers'
import { TEAM_ID, USER_ID } from '../../helpers/teams.helpers'

describe('TeamInvitationsService', () => {
	let service: TeamInvitationsService
	let prisma: ReturnType<typeof createInvitationsPrismaMock>
	let mailService: ReturnType<typeof createInvitationMailMock>

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createInvitationsPrismaMock()
		mailService = createInvitationMailMock()
		service = new TeamInvitationsService(prisma, mailService)
	})

	describe('sendInvitation', () => {
		it('должен создавать приглашение и отправлять email', async () => {
			prisma.team.findUnique.mockResolvedValue(TEAM)
			prisma.teamMember.findUnique.mockResolvedValue(INVITER)
			prisma.teamInvitation.findFirst.mockResolvedValue(null)
			prisma.user.findUnique.mockResolvedValue(null)
			prisma.teamInvitation.create.mockResolvedValue(PENDING_INVITATION)

			const result = await service.sendInvitation(TEAM_ID, USER_ID, {
				email: INVITED_EMAIL,
				role: 'MEMBER',
			})

			expect(prisma.teamInvitation.create).toHaveBeenCalledOnce()
			expect(prisma.teamInvitation.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						teamId: TEAM_ID,
						invitedById: USER_ID,
						email: INVITED_EMAIL,
						role: 'MEMBER',
						token: expect.any(String),
						expiresAt: expect.any(Date),
					}),
				}),
			)
			expect(mailService.sendTeamInvitationEmail).toHaveBeenCalledWith(
				INVITED_EMAIL,
				TEAM.name,
				INVITER.user.name,
				PENDING_INVITATION.token,
			)
			expect(result).toEqual(PENDING_INVITATION)
		})

		it('должен выбрасывать 409 если уже есть активное приглашение', async () => {
			prisma.team.findUnique.mockResolvedValue(TEAM)
			prisma.teamMember.findUnique.mockResolvedValue(INVITER)
			prisma.teamInvitation.findFirst.mockResolvedValue(PENDING_INVITATION)

			await expect(
				service.sendInvitation(TEAM_ID, USER_ID, {
					email: INVITED_EMAIL,
					role: 'MEMBER',
				}),
			).rejects.toThrow(ConflictException)
			expect(prisma.teamInvitation.create).not.toHaveBeenCalled()
		})

		it('должен выбрасывать 409 если пользователь уже состоит в команде', async () => {
			prisma.team.findUnique.mockResolvedValue(TEAM)
			prisma.teamMember.findUnique.mockResolvedValueOnce(INVITER).mockResolvedValueOnce({
				id: 'member-id-2',
				teamId: TEAM_ID,
				userId: 'user-id-2',
			})
			prisma.teamInvitation.findFirst.mockResolvedValue(null)
			prisma.user.findUnique.mockResolvedValue({ id: 'user-id-2' })

			await expect(
				service.sendInvitation(TEAM_ID, USER_ID, {
					email: INVITED_EMAIL,
					role: 'MEMBER',
				}),
			).rejects.toThrow(ConflictException)
		})
	})

	describe('getMyInvitations', () => {
		it('должен возвращать входящие приглашения пользователя', async () => {
			prisma.teamInvitation.findMany.mockResolvedValue([PENDING_INVITATION])

			const result = await service.getMyInvitations(USER_ID, INVITED_EMAIL)

			expect(prisma.teamInvitation.findMany).toHaveBeenCalledOnce()
			expect(result).toEqual([PENDING_INVITATION])
		})
	})

	describe('acceptInvitation', () => {
		it('должен принять приглашение и вернуть команду', async () => {
			prisma.teamInvitation.findUnique.mockResolvedValue(PENDING_INVITATION)
			prisma.teamMember.findUnique.mockResolvedValue(null)
			prisma.transaction.team.findUnique.mockResolvedValue(TEAM_WITH_MEMBERS)

			const result = await service.acceptInvitation(
				INVITATION_TOKEN,
				USER_ID,
				INVITED_EMAIL,
			)

			expect(prisma.$transaction).toHaveBeenCalledOnce()
			expect(prisma.transaction.teamMember.create).toHaveBeenCalledWith({
				data: {
					teamId: TEAM_ID,
					userId: USER_ID,
					role: PENDING_INVITATION.role,
				},
			})
			expect(prisma.transaction.teamInvitation.update).toHaveBeenCalledWith({
				where: { id: INVITATION_ID },
				data: { status: 'ACCEPTED' },
			})
			expect(result).toEqual(TEAM_WITH_MEMBERS)
		})

		it('должен помечать приглашение как EXPIRED и выбрасывать 410', async () => {
			prisma.teamInvitation.findUnique.mockResolvedValue({
				...PENDING_INVITATION,
				expiresAt: new Date('2026-04-08T10:00:00.000Z'),
			})
			prisma.teamInvitation.update.mockResolvedValue({
				...PENDING_INVITATION,
				status: 'EXPIRED',
			})

			await expect(
				service.acceptInvitation(INVITATION_TOKEN, USER_ID, INVITED_EMAIL),
			).rejects.toThrow(GoneException)
			expect(prisma.teamInvitation.update).toHaveBeenCalledWith({
				where: { id: INVITATION_ID },
				data: { status: 'EXPIRED' },
			})
		})

		it('должен выбрасывать 403 если email не совпадает', async () => {
			prisma.teamInvitation.findUnique.mockResolvedValue(PENDING_INVITATION)

			await expect(
				service.acceptInvitation(INVITATION_TOKEN, USER_ID, 'other@example.com'),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбрасывать 409 если пользователь уже участник команды', async () => {
			prisma.teamInvitation.findUnique.mockResolvedValue(PENDING_INVITATION)
			prisma.teamMember.findUnique.mockResolvedValue({
				id: 'member-id-2',
				teamId: TEAM_ID,
				userId: USER_ID,
				role: 'MEMBER',
			})

			await expect(
				service.acceptInvitation(INVITATION_TOKEN, USER_ID, INVITED_EMAIL),
			).rejects.toThrow(ConflictException)
		})
	})

	describe('declineInvitation', () => {
		it('должен отклонить приглашение', async () => {
			const declinedInvitation = { ...PENDING_INVITATION, status: 'DECLINED' as const }
			prisma.teamInvitation.findUnique.mockResolvedValue(PENDING_INVITATION)
			prisma.teamInvitation.update.mockResolvedValue(declinedInvitation)

			const result = await service.declineInvitation(
				INVITATION_TOKEN,
				USER_ID,
				INVITED_EMAIL,
			)

			expect(prisma.teamInvitation.update).toHaveBeenCalledWith({
				where: { id: INVITATION_ID },
				data: { status: 'DECLINED' },
				include: expect.any(Object),
			})
			expect(result).toEqual(declinedInvitation)
		})
	})

	describe('revokeInvitation', () => {
		it('должен отзывать приглашение для owner/admin', async () => {
			const revokedInvitation = { ...PENDING_INVITATION, status: 'DECLINED' as const }
			prisma.team.findUnique.mockResolvedValue(TEAM)
			prisma.teamMember.findUnique.mockResolvedValue(INVITER)
			prisma.teamInvitation.findUnique.mockResolvedValue(PENDING_INVITATION)
			prisma.teamInvitation.update.mockResolvedValue(revokedInvitation)

			const result = await service.revokeInvitation(TEAM_ID, USER_ID, INVITATION_ID)

			expect(prisma.teamInvitation.update).toHaveBeenCalledWith({
				where: { id: INVITATION_ID },
				data: { status: 'DECLINED' },
				include: expect.any(Object),
			})
			expect(result).toEqual(revokedInvitation)
		})

		it('должен выбрасывать 400 если приглашение уже обработано', async () => {
			prisma.team.findUnique.mockResolvedValue(TEAM)
			prisma.teamMember.findUnique.mockResolvedValue(INVITER)
			prisma.teamInvitation.findUnique.mockResolvedValue({
				...PENDING_INVITATION,
				status: 'ACCEPTED',
			})

			await expect(
				service.revokeInvitation(TEAM_ID, USER_ID, INVITATION_ID),
			).rejects.toThrow(BadRequestException)
		})
	})

	describe('expirePendingInvitations', () => {
		it('должен массово переводить просроченные приглашения в EXPIRED', async () => {
			prisma.teamInvitation.updateMany.mockResolvedValue({ count: 2 })

			const result = await service.expirePendingInvitations()

			expect(prisma.teamInvitation.updateMany).toHaveBeenCalledWith({
				where: {
					status: 'PENDING',
					expiresAt: { lt: expect.any(Date) },
				},
				data: { status: 'EXPIRED' },
			})
			expect(result).toEqual({ count: 2 })
		})
	})
})
