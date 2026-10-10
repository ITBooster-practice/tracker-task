import { createZodDto } from 'nestjs-zod'
import {
	archiveFeatureFlagSchema,
	createFeatureFlagSchema,
	updateFeatureFlagSchema,
	featureFlagsSnapshotSchema,
	featureFlagsListSchema,
	featureFlagsAccessSchema,
	featureFlagsServerTimeSchema,
	featureFlagMutationSchema,
	featureFlagAuditSchema,
} from '@repo/types'

export class CreateFeatureFlagDto extends createZodDto(createFeatureFlagSchema) {}
export class UpdateFeatureFlagDto extends createZodDto(updateFeatureFlagSchema) {}
export class ArchiveFeatureFlagDto extends createZodDto(archiveFeatureFlagSchema) {}
export class FeatureFlagsSnapshotDto extends createZodDto(featureFlagsSnapshotSchema) {}
export class FeatureFlagsListDto extends createZodDto(featureFlagsListSchema) {}
export class FeatureFlagsServerTimeDto extends createZodDto(
	featureFlagsServerTimeSchema,
) {}
export class FeatureFlagsAccessDto extends createZodDto(featureFlagsAccessSchema) {}
export class FeatureFlagMutationDto extends createZodDto(featureFlagMutationSchema) {}
export class FeatureFlagAuditDto extends createZodDto(featureFlagAuditSchema) {}
