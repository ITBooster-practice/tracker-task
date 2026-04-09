import { Module } from '@nestjs/common'

import { InvitationsController } from './invitations.controller'
import { TeamInvitationsController } from './team-invitations.controller'
import { TeamInvitationsService } from './team-invitations.service'

@Module({
	controllers: [TeamInvitationsController, InvitationsController],
	providers: [TeamInvitationsService],
})
export class TeamInvitationsModule {}
