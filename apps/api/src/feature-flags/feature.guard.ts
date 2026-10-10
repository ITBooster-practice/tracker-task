import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FeatureFlagsService } from './feature-flags.service'

export const REQUIRED_FEATURES = 'required-features'
export const RequireFeatures = (...keys: string[]) => SetMetadata(REQUIRED_FEATURES, keys)

@Injectable()
export class FeatureGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly flags: FeatureFlagsService,
	) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const keys =
			this.reflector.getAllAndMerge<string[]>(REQUIRED_FEATURES, [
				context.getHandler(),
				context.getClass(),
			]) ?? []
		for (const key of new Set(keys)) await this.flags.requireEnabled(key)
		return true
	}
}
