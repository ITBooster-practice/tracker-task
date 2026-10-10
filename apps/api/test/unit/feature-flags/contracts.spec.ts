import { describe, expect, it } from 'vitest'
import {
	archiveFeatureFlagSchema,
	createFeatureFlagSchema,
	updateFeatureFlagSchema,
} from '@repo/types'

const flag = { key: 'boards-redesign-v2', title: 'Обновление досок', enabled: false }
describe('Feature flag contracts', () => {
	it('accepts a new disabled release flag', () =>
		expect(createFeatureFlagSchema.safeParse(flag).success).toBe(true))
	it.each(['Boards', 'boards_v2', 'two--words', '-boards', 'x'.repeat(81)])(
		'rejects invalid key %s',
		(key) => {
			expect(createFeatureFlagSchema.safeParse({ ...flag, key }).success).toBe(false)
		},
	)
	it('rejects renaming a technical key', () => {
		expect(
			updateFeatureFlagSchema.safeParse({ key: 'new-key', expectedVersion: 0 }).success,
		).toBe(false)
	})
	it('requires an optimistic concurrency version and a changed field', () => {
		expect(updateFeatureFlagSchema.safeParse({ enabled: true }).success).toBe(false)
		expect(updateFeatureFlagSchema.safeParse({ expectedVersion: 0 }).success).toBe(false)
		expect(
			updateFeatureFlagSchema.safeParse({ enabled: true, expectedVersion: 0 }).success,
		).toBe(true)
	})
	it('requires a version for archiving', () => {
		expect(archiveFeatureFlagSchema.safeParse({}).success).toBe(false)
	})
})
