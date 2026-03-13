import { Module } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { TeamsController } from './teams.controller'
import { TeamMembersModule } from './members/team-members.module'

@Module({
	imports: [TeamMembersModule],
	controllers: [TeamsController],
	providers: [TeamsService],
})
export class TeamsModule {}
