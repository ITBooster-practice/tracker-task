import { z } from 'zod'

export { FEATURE_KEYS, FEATURE_REGISTRY, getConnectedFeature } from './registry'

export type FeatureFlagKey = string

// Состав флагов и подключение меняются только кодом и миграциями.
export const updateFeatureFlagSchema = z.strictObject({
	enabled: z.boolean(),
	expectedVersion: z.number().int().nonnegative(),
})
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>

const snapshotItemSchema = z.object({
	key: z.string(),
	enabled: z.boolean(),
	updatedAt: z.iso.datetime(),
})
export const featureFlagsSnapshotSchema = z.object({
	version: z.number().int().nonnegative(),
	flags: z.array(snapshotItemSchema),
})
const flagSchema = snapshotItemSchema.extend({
	id: z.string(),
	connectedFeature: z.string().nullable(),
})
export const featureFlagsListSchema = z.object({
	version: z.number().int().nonnegative(),
	flags: z.array(flagSchema),
})
export const featureFlagsAccessSchema = z.object({ canManage: z.boolean() })
export const featureFlagMutationSchema = z.object({
	version: z.number().int().nonnegative(),
	flag: flagSchema,
})

export type FeatureFlagSnapshotItem = z.infer<typeof snapshotItemSchema>
export type FeatureFlagsSnapshot = z.infer<typeof featureFlagsSnapshotSchema>
export type FeatureFlag = z.infer<typeof flagSchema>
export type FeatureFlagsList = z.infer<typeof featureFlagsListSchema>
export type FeatureFlagsAccess = z.infer<typeof featureFlagsAccessSchema>
