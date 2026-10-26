import { beforeEach, describe, expect, it, vi } from 'vitest'

import { client } from '@/shared/lib/api/client'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

vi.mock('@/shared/lib/api/client', () => ({
	client: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		defaults: { baseURL: 'https://example.test/api/' },
	},
}))
const snapshot = {
	version: 3,
	flags: [{ key: 'boards', enabled: true, updatedAt: '2026-10-10T00:00:00.000Z' }],
}
describe('Feature flags API client', () => {
	beforeEach(() => vi.clearAllMocks())
	it('validates loaded data and supports ETag 304 with an existing snapshot', async () => {
		vi.mocked(client.get).mockResolvedValue({ status: 200, data: snapshot })
		expect(await featureFlagsService.snapshot()).toEqual(snapshot)
		vi.mocked(client.get).mockResolvedValue({ status: 304 })
		expect(await featureFlagsService.snapshot(snapshot)).toBe(snapshot)
		expect(client.get).toHaveBeenLastCalledWith(
			'/feature-flags/snapshot',
			expect.objectContaining({ headers: { 'If-None-Match': '"feature-flags-3"' } }),
		)
	})
	it('rejects invalid snapshots instead of enabling a feature', async () => {
		vi.mocked(client.get).mockResolvedValue({
			status: 200,
			data: { version: 4, flags: [{ key: 'boards', enabled: 'true' }] },
		})
		await expect(featureFlagsService.snapshot()).rejects.toThrow()
	})
	it('passes an abort signal for cancelled refreshes', async () => {
		vi.mocked(client.get).mockResolvedValue({ status: 200, data: snapshot })
		const abort = new AbortController()
		await featureFlagsService.snapshot(undefined, abort.signal)
		expect(client.get).toHaveBeenLastCalledWith(
			'/feature-flags/snapshot',
			expect.objectContaining({ signal: abort.signal }),
		)
	})
	it('constructs the event URL without tokens', () =>
		expect(featureFlagsService.eventsUrl()).toBe(
			'https://example.test/api/feature-flags/events',
		))
})
