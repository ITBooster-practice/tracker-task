import { Injectable, NotImplementedException } from '@nestjs/common'

import { SendInvitationDto } from './dto/send-invitation.dto'

@Injectable()
export class TeamInvitationsService {
	async sendInvitation(teamId: string, invitedById: string, dto: SendInvitationDto) {
		throw new NotImplementedException(
			`sendInvitation is not implemented: ${teamId}:${invitedById}:${dto.email}`,
		)
	}

	async getTeamInvitations(teamId: string, actorId: string) {
		throw new NotImplementedException(
			`getTeamInvitations is not implemented: ${teamId}:${actorId}`,
		)
	}

	async getMyInvitations(userId: string, userEmail: string) {
		throw new NotImplementedException(
			`getMyInvitations is not implemented: ${userId}:${userEmail}`,
		)
	}

	async acceptInvitation(token: string, userId: string, userEmail: string) {
		throw new NotImplementedException(
			`acceptInvitation is not implemented: ${token}:${userId}:${userEmail}`,
		)
	}

	async declineInvitation(token: string, userId: string, userEmail: string) {
		throw new NotImplementedException(
			`declineInvitation is not implemented: ${token}:${userId}:${userEmail}`,
		)
	}

	async revokeInvitation(teamId: string, actorId: string, invitationId: string) {
		throw new NotImplementedException(
			`revokeInvitation is not implemented: ${teamId}:${actorId}:${invitationId}`,
		)
	}

	async expirePendingInvitations() {
		throw new NotImplementedException('expirePendingInvitations is not implemented')
	}
}
