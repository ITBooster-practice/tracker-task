import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setCookieHeader } from '@/shared/lib/api/auth-cookies'

vi.mock('next/headers', () => ({
	cookies: async () => ({ toString: () => 'accessToken=test-cookie' }),
}))
afterEach(() => vi.unstubAllEnvs())
describe('Internal server API address', () => {
	it('uses the internal address while keeping the authenticated cookie', async () => {
		vi.stubEnv('API_INTERNAL_URL', 'http://api:3000')
		const request = {
			baseURL: 'https://stage.example/api',
			headers: new AxiosHeaders(),
		} as InternalAxiosRequestConfig
		await setCookieHeader(request)
		expect(request.baseURL).toBe('http://api:3000')
		expect(request.headers.get('Cookie')).toBe('accessToken=test-cookie')
	})
	it('keeps the public address when no internal address is configured', async () => {
		vi.stubEnv('API_INTERNAL_URL', '')
		const request = {
			baseURL: 'http://localhost:3000',
			headers: new AxiosHeaders(),
		} as InternalAxiosRequestConfig
		await setCookieHeader(request)
		expect(request.baseURL).toBe('http://localhost:3000')
	})
})
