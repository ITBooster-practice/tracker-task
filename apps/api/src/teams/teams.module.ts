import { Module } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { TeamsController } from './teams.controller'
import { TeamInvitationsModule } from './invitations/team-invitations.module'
import { TeamMembersModule } from './members/team-members.module'
import { RolesGuard } from '../guards/roles.guard'

@Module({
	imports: [TeamMembersModule, TeamInvitationsModule],
	controllers: [TeamsController],
	providers: [TeamsService, RolesGuard],
})
export class TeamsModule {}
