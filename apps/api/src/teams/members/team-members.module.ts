import { Module } from '@nestjs/common'
import { RolesGuard } from '../../guards/roles.guard'
import { TeamMembersController } from './team-members.controller'
import { TeamMembersService } from './team-members.service'

@Module({
	controllers: [TeamMembersController],
	providers: [TeamMembersService, RolesGuard],
})
export class TeamMembersModule {}
