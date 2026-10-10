import { applyDecorators, UseGuards } from '@nestjs/common'
import { FeatureGuard } from '../../feature-flags/feature.guard'
import { JwtGuard } from 'src/guards/auth.guard'

export function Authorization() {
	return applyDecorators(UseGuards(JwtGuard, FeatureGuard))
}
