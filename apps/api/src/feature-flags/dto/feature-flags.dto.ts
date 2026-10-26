import { createZodDto } from 'nestjs-zod'
import {
	updateFeatureFlagSchema,
	featureFlagsSnapshotSchema,
	featureFlagsListSchema,
	featureFlagsAccessSchema,
	featureFlagMutationSchema,
} from '@repo/types'

export class UpdateFeatureFlagDto extends createZodDto(updateFeatureFlagSchema) {}
export class FeatureFlagsSnapshotDto extends createZodDto(featureFlagsSnapshotSchema) {}
export class FeatureFlagsListDto extends createZodDto(featureFlagsListSchema) {}
export class FeatureFlagsAccessDto extends createZodDto(featureFlagsAccessSchema) {}
export class FeatureFlagMutationDto extends createZodDto(featureFlagMutationSchema) {}
