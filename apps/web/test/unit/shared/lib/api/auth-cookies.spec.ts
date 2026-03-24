import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import type { NextResponse } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import {
	appendSetCookieHeaders,
	clearAuthCookies,
	isClientSide,
	setCookieHeader,
} from '@/shared/lib/api/auth-cookies'

describe('isClientSide', () => {
	it('в браузере (window существует) → true', () => {
		expect(isClientSide()).toBe(true) // jsdom даёт window
	})
})

describe('setCookieHeader', () => {
	it('есть cookies', async () => {
		const mockCookieStore = { toString: () => 'accessToken=abc; refreshToken=xyz' }

		vi.doMock('next/headers', () => ({
			cookies: () => Promise.resolve(mockCookieStore),
		}))

		const request = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

		await setCookieHeader(request)

		expect(request.headers.get('Cookie')).toBe('accessToken=abc; refreshToken=xyz')

		vi.doUnmock('next/headers')
	})

	it('пустые cookies', async () => {
		const mockCookieStore = { toString: () => '' }

		vi.doMock('next/headers', () => ({
			cookies: () => Promise.resolve(mockCookieStore),
		}))

		const request = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

		await setCookieHeader(request)

		expect(request.headers.has('Cookie')).toBe(false)

		vi.doUnmock('next/headers')
	})
})

describe('clearAuthCookies', () => {
	it('удаляет accessToken и refreshToken', async () => {
		const deleteFn = vi.fn()
		const mockCookieStore = { delete: deleteFn }

		vi.doMock('next/headers', () => ({
			cookies: () => Promise.resolve(mockCookieStore),
		}))

		await clearAuthCookies()

		expect(deleteFn).toHaveBeenCalledWith('accessToken')
		expect(deleteFn).toHaveBeenCalledWith('refreshToken')
		expect(deleteFn).toHaveBeenCalledTimes(2)

		vi.doUnmock('next/headers')
	})
})

describe('appendSetCookieHeaders', () => {
	it('добавляет каждую cookie как отдельный Set-Cookie заголовок', () => {
		const appendFn = vi.fn()
		const response = {
			headers: { append: appendFn },
		} as unknown as NextResponse

		appendSetCookieHeaders(response, [
			'accessToken=abc; Path=/',
			'refreshToken=xyz; Path=/',
		])

		expect(appendFn).toHaveBeenCalledWith('Set-Cookie', 'accessToken=abc; Path=/')
		expect(appendFn).toHaveBeenCalledWith('Set-Cookie', 'refreshToken=xyz; Path=/')
	})

	it('пустой массив', () => {
		const appendFn = vi.fn()
		const response = {
			headers: { append: appendFn },
		} as unknown as NextResponse

		appendSetCookieHeaders(response, [])

		expect(appendFn).not.toHaveBeenCalled()
	})
})
