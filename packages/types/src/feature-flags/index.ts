import { z } from 'zod'

export const FEATURE_KEYS = {
	PROJECTS: 'projects',
	TASKS: 'tasks',
	BOARDS: 'boards',
	TEAM_SETTINGS: 'team-settings',
} as const

/** Remove a key from this registry only after removing its checks from all supported releases. */
export const REQUIRED_FEATURE_KEYS: readonly string[] = Object.values(FEATURE_KEYS)
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
	enabled: z.boolean(),
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
		enabled: fields.enabled.optional(),
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
	required: boolean
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
	action: string
	before: unknown
	after: unknown
	version: number
	createdAt: string
}
