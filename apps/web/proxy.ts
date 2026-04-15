import { NextResponse, type NextRequest, type ProxyConfig } from 'next/server'

import {
	getAuthRedirectPath,
	isAuthRoute,
	isProtectedRoute,
	ROUTE_QUERY_PARAMS,
	ROUTES,
} from '@/shared/config'
import { appendSetCookieHeaders, clearAuthCookies } from '@/shared/lib/api/auth-cookies'
import {
	refreshAuthSession,
	type AuthRefreshResult,
} from '@/shared/lib/api/refresh-auth-session'
import { isTokenExpiredSoon } from '@/shared/lib/session'

const createLoginRedirect = (request: NextRequest) => {
	const { pathname, search } = request.nextUrl
	const url = new URL(ROUTES.login, request.url)

	if (!isAuthRoute(pathname)) {
		url.searchParams.set(ROUTE_QUERY_PARAMS.from, `${pathname}${search}`)
	}

	return NextResponse.redirect(url)
}

const shouldRefresh = (request: NextRequest) => {
	const { pathname } = request.nextUrl
	const accessToken = request.cookies.get('accessToken')?.value
	const refreshToken = request.cookies.get('refreshToken')?.value

	const isAppRoute = isAuthRoute(pathname) || isProtectedRoute(pathname)

	return !!(
		refreshToken &&
		isAppRoute &&
		(!accessToken || isTokenExpiredSoon(accessToken))
	)
}

const shouldClearAuthCookies = (request: NextRequest) => {
	const { pathname, searchParams } = request.nextUrl
	return Boolean(
		pathname === ROUTES.login && searchParams.get(ROUTE_QUERY_PARAMS.clearAuth) === '1',
	)
}

const handleRefresh = async (request: NextRequest) => {
	const { pathname, searchParams } = request.nextUrl
	try {
		const refreshResult: AuthRefreshResult | null = await refreshAuthSession()

		if (!refreshResult) {
			throw new Error('Failed to refresh session')
		}

		const response = isAuthRoute(pathname)
			? NextResponse.redirect(
					new URL(
						getAuthRedirectPath(searchParams.get(ROUTE_QUERY_PARAMS.from)),
						request.url,
					),
				)
			: NextResponse.next()

		appendSetCookieHeaders(response, refreshResult.setCookies)

		return response
	} catch {
		await clearAuthCookies()
		return createLoginRedirect(request)
	}
}

export async function proxy(request: NextRequest) {
	const { pathname, searchParams } = request.nextUrl

	if (shouldClearAuthCookies(request)) {
		await clearAuthCookies()
		return NextResponse.redirect(new URL(ROUTES.login, request.url))
	}

	if (shouldRefresh(request)) {
		return handleRefresh(request)
	}

	const accessToken = request.cookies.get('accessToken')?.value

	if (accessToken && isAuthRoute(pathname)) {
		return NextResponse.redirect(
			new URL(
				getAuthRedirectPath(searchParams.get(ROUTE_QUERY_PARAMS.from)),
				request.url,
			),
		)
	}

	if (!accessToken && isProtectedRoute(pathname)) {
		return createLoginRedirect(request)
	}

	return NextResponse.next()
}

export const config: ProxyConfig = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
