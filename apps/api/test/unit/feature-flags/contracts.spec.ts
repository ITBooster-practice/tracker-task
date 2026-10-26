import { describe, expect, it } from 'vitest'
import { getConnectedFeature, updateFeatureFlagSchema } from '@repo/types'

describe('Feature flag contracts', () => {
	it('requires both the state and the snapshot version', () => {
		expect(
			updateFeatureFlagSchema.safeParse({ enabled: true, expectedVersion: 0 }).success,
		).toBe(true)
		for (const body of [
			{ enabled: true },
			{ expectedVersion: 0 },
			{ enabled: 'true', expectedVersion: 0 },
			{ enabled: true, expectedVersion: -1 },
		])
			expect(updateFeatureFlagSchema.safeParse(body).success).toBe(false)
	})
	it.each([
		'key',
		'title',
		'description',
		'expiresAt',
		'connectedFeature',
		'archivedAt',
		'createdById',
	])('rejects non-state changes: %s', (field) =>
		expect(
			updateFeatureFlagSchema.safeParse({
				enabled: false,
				expectedVersion: 0,
				[field]: 'value',
			}).success,
		).toBe(false),
	)
	it('only recognizes own registry keys', () => {
		expect(getConnectedFeature('boards')).toBe('Доски')
		expect(getConnectedFeature('backlog')).toBe('Бэклог')
		for (const key of ['search-v1', 'constructor', 'toString', '__proto__'])
			expect(getConnectedFeature(key)).toBeNull()
	})
})
