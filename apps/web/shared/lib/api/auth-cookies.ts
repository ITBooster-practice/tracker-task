import type { InternalAxiosRequestConfig } from 'axios'
import type { NextResponse } from 'next/server'

const AUTH_COOKIE_NAMES = ['accessToken', 'refreshToken'] as const

const isClientSide = () => typeof window !== 'undefined'

const setCookieHeader = async (request: InternalAxiosRequestConfig) => {
	const { cookies } = await import('next/headers')
	const cookieStore = await cookies()
	// Used only by server-side interceptors; browser requests keep the public API URL.
	if (process.env.API_INTERNAL_URL) request.baseURL = process.env.API_INTERNAL_URL
	const cookieHeader = cookieStore.toString()

	if (cookieHeader) {
		request.headers.set('Cookie', cookieHeader)
	}
}

const clearAuthCookies = async () => {
	const { cookies } = await import('next/headers')
	const cookieStore = await cookies()

	AUTH_COOKIE_NAMES.forEach((cookieName) => {
		cookieStore.delete(cookieName)
	})
}

const appendSetCookieHeaders = (response: NextResponse, setCookies: string[]) => {
	setCookies.forEach((cookie) => {
		response.headers.append('Set-Cookie', cookie)
	})
}

export { appendSetCookieHeaders, clearAuthCookies, isClientSide, setCookieHeader }
