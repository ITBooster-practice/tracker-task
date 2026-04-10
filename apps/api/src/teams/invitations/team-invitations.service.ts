import { randomUUID } from 'node:crypto'
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	GoneException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { PrismaService } from '../../../prisma/prisma.service'
import {
	INVITATION_ERROR_MESSAGES,
	INVITATION_LOG_MESSAGES,
	TEAM_INVITATION_EXPIRE_CRON,
	TEAM_INVITATION_EXPIRES_IN_HOURS,
} from '../../common/constants/invitations.constants'
import { MailService } from '../../mail/mail.service'

import { SendInvitationDto } from './dto/send-invitation.dto'

@Injectable()
export class TeamInvitationsService {
	private readonly logger = new Logger(TeamInvitationsService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly mailService: MailService,
	) {}

	private getInvitationExpiresAt(baseDate: Date) {
		return new Date(
			baseDate.getTime() + TEAM_INVITATION_EXPIRES_IN_HOURS * 60 * 60 * 1000,
		)
	}

	private async getTeamOrThrow(teamId: string) {
		const team = await this.prisma.team.findUnique({
			where: { id: teamId },
			select: {
				id: true,
				name: true,
				description: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!team) {
			throw new NotFoundException(INVITATION_ERROR_MESSAGES.TEAM_NOT_FOUND)
		}

		return team
	}

	private async assertCanManageInvitations(teamId: string, actorId: string) {
		await this.getTeamOrThrow(teamId)

		const actor = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: actorId } },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
			},
		})

		if (!actor || (actor.role !== 'OWNER' && actor.role !== 'ADMIN')) {
			throw new ForbiddenException(INVITATION_ERROR_MESSAGES.MANAGE_FORBIDDEN)
		}

		return actor
	}

	private async getInvitationByTokenOrThrow(token: string) {
		const invitation = await this.prisma.teamInvitation.findUnique({
			where: { token },
			include: {
				team: {
					select: { id: true, name: true, description: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		})

		if (!invitation) {
			throw new NotFoundException(INVITATION_ERROR_MESSAGES.INVITATION_NOT_FOUND)
		}

		return invitation
	}

	private async expireInvitationIfNeeded(invitationId: string, expiresAt: Date) {
		if (expiresAt.getTime() > Date.now()) {
			return
		}

		await this.prisma.teamInvitation.update({
			where: { id: invitationId },
			data: { status: 'EXPIRED' },
		})

		throw new GoneException(INVITATION_ERROR_MESSAGES.INVITATION_EXPIRED)
	}

	private async getTeamDetails(teamId: string) {
		const team = await this.prisma.team.findUnique({
			where: { id: teamId },
			include: {
				members: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
					},
				},
			},
		})

		if (!team) {
			throw new NotFoundException(INVITATION_ERROR_MESSAGES.TEAM_NOT_FOUND)
		}

		return team
	}

	async sendInvitation(teamId: string, invitedById: string, dto: SendInvitationDto) {
		const now = new Date()

		const [team, inviter, activeInvitation, invitedUser] = await Promise.all([
			this.getTeamOrThrow(teamId),
			this.assertCanManageInvitations(teamId, invitedById),
			this.prisma.teamInvitation.findFirst({
				where: {
					teamId,
					email: dto.email,
					status: 'PENDING',
					expiresAt: { gt: now },
				},
			}),
			this.prisma.user.findUnique({
				where: { email: dto.email },
				select: { id: true },
			}),
		])

		if (activeInvitation) {
			throw new ConflictException(INVITATION_ERROR_MESSAGES.DUPLICATE_PENDING)
		}

		if (invitedUser) {
			const member = await this.prisma.teamMember.findUnique({
				where: {
					teamId_userId: {
						teamId,
						userId: invitedUser.id,
					},
				},
			})

			if (member) {
				throw new ConflictException(INVITATION_ERROR_MESSAGES.ALREADY_MEMBER)
			}
		}

		const invitation = await this.prisma.teamInvitation.create({
			data: {
				teamId,
				invitedById,
				email: dto.email,
				role: dto.role,
				token: randomUUID(),
				expiresAt: this.getInvitationExpiresAt(now),
			},
			include: {
				team: {
					select: { id: true, name: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		})

		try {
			await this.mailService.sendTeamInvitationEmail(
				dto.email,
				team.name,
				inviter.user.name,
				invitation.token,
			)
		} catch (error) {
			this.logger.error(INVITATION_LOG_MESSAGES.SEND_EMAIL_FAILED, error)
		}

		return invitation
	}

	async getTeamInvitations(teamId: string, actorId: string) {
		await this.assertCanManageInvitations(teamId, actorId)

		return this.prisma.teamInvitation.findMany({
			where: { teamId },
			include: {
				team: {
					select: { id: true, name: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	async getMyInvitations(userId: string, userEmail: string) {
		void userId

		return this.prisma.teamInvitation.findMany({
			where: {
				email: userEmail,
				status: 'PENDING',
				expiresAt: { gt: new Date() },
			},
			include: {
				team: {
					select: { id: true, name: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	async acceptInvitation(token: string, userId: string, userEmail: string) {
		const invitation = await this.getInvitationByTokenOrThrow(token)

		if (invitation.status !== 'PENDING') {
			throw new BadRequestException(
				INVITATION_ERROR_MESSAGES.INVITATION_ALREADY_PROCESSED,
			)
		}

		await this.expireInvitationIfNeeded(invitation.id, invitation.expiresAt)

		if (invitation.email !== userEmail) {
			throw new ForbiddenException(INVITATION_ERROR_MESSAGES.INVITATION_EMAIL_MISMATCH)
		}

		const existingMember = await this.prisma.teamMember.findUnique({
			where: {
				teamId_userId: {
					teamId: invitation.teamId,
					userId,
				},
			},
		})

		if (existingMember) {
			throw new ConflictException(INVITATION_ERROR_MESSAGES.ALREADY_MEMBER)
		}

		const team = await this.prisma.$transaction(async (transaction) => {
			await transaction.teamMember.create({
				data: {
					teamId: invitation.teamId,
					userId,
					role: invitation.role,
				},
			})

			await transaction.teamInvitation.update({
				where: { id: invitation.id },
				data: { status: 'ACCEPTED' },
			})

			const nextTeam = await transaction.team.findUnique({
				where: { id: invitation.teamId },
				include: {
					members: {
						include: {
							user: {
								select: { id: true, name: true, email: true },
							},
						},
					},
				},
			})

			if (!nextTeam) {
				throw new NotFoundException(INVITATION_ERROR_MESSAGES.TEAM_NOT_FOUND)
			}

			return nextTeam
		})

		return team
	}

	async declineInvitation(token: string, userId: string, userEmail: string) {
		void userId

		const invitation = await this.getInvitationByTokenOrThrow(token)

		if (invitation.status !== 'PENDING') {
			throw new BadRequestException(
				INVITATION_ERROR_MESSAGES.INVITATION_ALREADY_PROCESSED,
			)
		}

		await this.expireInvitationIfNeeded(invitation.id, invitation.expiresAt)

		if (invitation.email !== userEmail) {
			throw new ForbiddenException(INVITATION_ERROR_MESSAGES.INVITATION_EMAIL_MISMATCH)
		}

		return this.prisma.teamInvitation.update({
			where: { id: invitation.id },
			data: { status: 'DECLINED' },
			include: {
				team: {
					select: { id: true, name: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		})
	}

	async revokeInvitation(teamId: string, actorId: string, invitationId: string) {
		await this.assertCanManageInvitations(teamId, actorId)

		const invitation = await this.prisma.teamInvitation.findUnique({
			where: { id: invitationId },
		})

		if (!invitation || invitation.teamId !== teamId) {
			throw new NotFoundException(INVITATION_ERROR_MESSAGES.INVITATION_NOT_FOUND)
		}

		if (invitation.status !== 'PENDING') {
			throw new BadRequestException(
				INVITATION_ERROR_MESSAGES.INVITATION_ALREADY_PROCESSED,
			)
		}

		await this.expireInvitationIfNeeded(invitation.id, invitation.expiresAt)

		return this.prisma.teamInvitation.update({
			where: { id: invitationId },
			data: { status: 'DECLINED' },
			include: {
				team: {
					select: { id: true, name: true, avatarUrl: true },
				},
				invitedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		})
	}

	@Cron(TEAM_INVITATION_EXPIRE_CRON)
	async expirePendingInvitations() {
		return this.prisma.teamInvitation.updateMany({
			where: {
				status: 'PENDING',
				expiresAt: { lt: new Date() },
			},
			data: { status: 'EXPIRED' },
		})
	}
}
