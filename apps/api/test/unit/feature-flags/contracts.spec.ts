import { describe, expect, it } from 'vitest'
import {
	archiveFeatureFlagSchema,
	getConnectedFeature,
	FEATURE_REGISTRY,
	REQUIRED_FEATURE_KEYS,
	createFeatureFlagSchema,
	updateFeatureFlagSchema,
} from '@repo/types'

const flag = { key: 'boards-redesign-v2', title: 'Обновление досок' }
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
	it.each([true, false])('не принимает enabled при создании: %s', (enabled) => {
		expect(createFeatureFlagSchema.safeParse({ ...flag, enabled }).success).toBe(false)
	})
	it('не позволяет назначить подключение через запрос', () => {
		expect(
			createFeatureFlagSchema.safeParse({ ...flag, connectedFeature: 'Поиск' }).success,
		).toBe(false)
		expect(
			updateFeatureFlagSchema.safeParse({ connectedFeature: 'Поиск', expectedVersion: 0 })
				.success,
		).toBe(false)
	})
	it('разрешает подключение только для собственных ключей реестра', () => {
		expect(getConnectedFeature('boards')).toBe('Доски')
		expect(getConnectedFeature('backlog')).toBe('Бэклог')
		for (const key of ['search-v1', 'constructor', 'toString', '__proto__'])
			expect(getConnectedFeature(key)).toBeNull()
		expect(REQUIRED_FEATURE_KEYS).toEqual(Object.keys(FEATURE_REGISTRY))
	})
	it('requires a version for archiving', () => {
		expect(archiveFeatureFlagSchema.safeParse({}).success).toBe(false)
	})
})
