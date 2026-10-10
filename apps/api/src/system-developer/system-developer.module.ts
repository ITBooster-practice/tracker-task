import { Module } from '@nestjs/common'
import { SystemDeveloperGuard } from './system-developer.guard'
import { SystemDeveloperService } from './system-developer.service'

@Module({
	providers: [SystemDeveloperService, SystemDeveloperGuard],
	exports: [SystemDeveloperService, SystemDeveloperGuard],
})
export class SystemDeveloperModule {}
