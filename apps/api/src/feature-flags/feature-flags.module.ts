import { FeatureGuard } from './feature.guard'
import { FeatureFlagsEventsService } from './feature-flags-events.service'
import { FeatureFlagsEventsController } from './feature-flags-events.controller'
import { AuthModule } from '../auth/auth.module'
import { Global, Module } from '@nestjs/common'
import { SystemDeveloperModule } from '../system-developer/system-developer.module'
import { FeatureFlagsController } from './feature-flags.controller'
import { FeatureFlagsService } from './feature-flags.service'

@Global()
@Module({
	imports: [SystemDeveloperModule, AuthModule],
	controllers: [FeatureFlagsController, FeatureFlagsEventsController],
	providers: [FeatureFlagsService, FeatureGuard, FeatureFlagsEventsService],
	exports: [FeatureFlagsService, FeatureGuard],
})
export class FeatureFlagsModule {}
