import {
	isAuthRoute,
	isProtectedRoute,
	ROUTE_QUERY_PARAMS,
	ROUTES,
} from '@/shared/config/routes'
import { NextResponse, type NextRequest, type ProxyConfig } from 'next/server'

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl
	const accessToken = !!request.cookies.get('accessToken')?.value
	const refreshToken = !!request.cookies.get('refreshToken')?.value

	if (!refreshToken && isProtectedRoute(pathname)) {
		const url = new URL(ROUTES.login, request.url)
		url.searchParams.set(ROUTE_QUERY_PARAMS.from, `${pathname}${search}`)
		return NextResponse.redirect(url)
	}

	if ((accessToken || refreshToken) && isAuthRoute(pathname)) {
		return NextResponse.redirect(new URL(ROUTES.teams, request.url))
	}

	return NextResponse.next()
}

export const config: ProxyConfig = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
