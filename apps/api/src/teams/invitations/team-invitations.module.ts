import { Module } from '@nestjs/common'

import { RolesGuard } from '../../guards/roles.guard'
import { MailModule } from '../../mail/mail.module'
import { InvitationsController } from './invitations.controller'
import { TeamInvitationsController } from './team-invitations.controller'
import { TeamInvitationsService } from './team-invitations.service'

@Module({
	imports: [MailModule],
	controllers: [TeamInvitationsController, InvitationsController],
	providers: [TeamInvitationsService, RolesGuard],
})
export class TeamInvitationsModule {}
