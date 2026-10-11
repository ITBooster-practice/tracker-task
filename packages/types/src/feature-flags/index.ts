import { z } from 'zod'

export {
	FEATURE_KEYS,
	FEATURE_REGISTRY,
	REQUIRED_FEATURE_KEYS,
	getConnectedFeature,
} from './registry'

export type FeatureFlagKey = string

export const featureFlagKeySchema = z
	.string()
	.min(1)
	.max(80)
	.regex(
		/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
		'Ключ: строчные латинские буквы, цифры и дефисы',
	)
const fields = {
	title: z.string().trim().min(1).max(100),
	description: z.string().trim().max(1000).nullable().optional(),
	expiresAt: z.iso.datetime().nullable().optional(),
}
export const createFeatureFlagSchema = z.strictObject({
	key: featureFlagKeySchema,
	...fields,
})
export const updateFeatureFlagSchema = z
	.strictObject({
		title: fields.title.optional(),
		description: fields.description,
		enabled: z.boolean().optional(),
		expiresAt: fields.expiresAt,
		expectedVersion: z.number().int().nonnegative(),
	})
	.refine(
		(value) => Object.keys(value).some((key) => key !== 'expectedVersion'),
		'Укажите изменяемые поля',
	)
export const archiveFeatureFlagSchema = z.strictObject({
	expectedVersion: z.number().int().nonnegative(),
})
export type CreateFeatureFlag = z.infer<typeof createFeatureFlagSchema>
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>
export type ArchiveFeatureFlag = z.infer<typeof archiveFeatureFlagSchema>

const snapshotItemSchema = z.object({
	key: z.string(),
	enabled: z.boolean(),
	updatedAt: z.iso.datetime(),
})
export const featureFlagsSnapshotSchema = z.object({
	version: z.number().int(),
	flags: z.array(snapshotItemSchema),
})
const flagSchema = snapshotItemSchema.extend({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	createdAt: z.iso.datetime(),
	archivedAt: z.iso.datetime().nullable(),
	expiresAt: z.iso.datetime().nullable(),
	createdById: z.string(),
	createdByName: z.string().nullable().optional(),
	required: z.boolean(),
	connectedFeature: z.string().nullable(),
})
export const featureFlagsListSchema = z.object({
	version: z.number().int(),
	flags: z.array(flagSchema),
})
export const featureFlagsServerTimeSchema = z.object({ serverTime: z.iso.datetime() })
export const featureFlagsAccessSchema = z.object({ canManage: z.boolean() })
export const featureFlagMutationSchema = z.object({
	version: z.number().int(),
	flag: flagSchema,
})
export const featureFlagAuditSchema = z.object({
	id: z.string(),
	flagId: z.string(),
	actorId: z.string(),
	actorName: z.string().nullable().optional(),
	action: z.string(),
	before: z.unknown(),
	after: z.unknown(),
	version: z.number().int(),
	createdAt: z.iso.datetime(),
})

export interface FeatureFlagSnapshotItem {
	key: FeatureFlagKey
	enabled: boolean
	updatedAt: string
}
export interface FeatureFlagsSnapshot {
	version: number
	flags: FeatureFlagSnapshotItem[]
}
export interface FeatureFlag extends FeatureFlagSnapshotItem {
	id: string
	title: string
	description: string | null
	createdAt: string
	archivedAt: string | null
	expiresAt: string | null
	createdById: string
	createdByName?: string | null
	required: boolean
	connectedFeature: string | null
}
export interface FeatureFlagsList {
	version: number
	flags: FeatureFlag[]
}
export interface FeatureFlagsAccess {
	canManage: boolean
}
export interface FeatureFlagAudit {
	id: string
	flagId: string
	actorId: string
	actorName?: string | null
	action: string
	before: unknown
	after: unknown
	version: number
	createdAt: string
}
