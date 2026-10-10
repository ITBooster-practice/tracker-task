import { Global, Module } from '@nestjs/common'
import { SystemDeveloperModule } from '../system-developer/system-developer.module'
import { FeatureFlagsController } from './feature-flags.controller'
import { FeatureFlagsService } from './feature-flags.service'

@Global()
@Module({
	imports: [SystemDeveloperModule],
	controllers: [FeatureFlagsController],
	providers: [FeatureFlagsService],
	exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
