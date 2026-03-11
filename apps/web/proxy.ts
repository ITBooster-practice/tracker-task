import { NextResponse, type NextRequest, type ProxyConfig } from 'next/server'

const AUTH_ROUTES = ['/login', '/register']
const PROTECTED_ROUTES = ['/tasks', '/projects', '/settings']

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl
	const refreshToken = !!request.cookies.get('refreshToken')?.value

	const isAuthRoute = pathname === '/' || AUTH_ROUTES.includes(pathname)
	const isProtectedRoute = PROTECTED_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	)

	if (!refreshToken && isProtectedRoute) {
		const url = new URL('/login', request.url)
		url.searchParams.set('from', `${pathname}${search}`)
		return NextResponse.redirect(url)
	}

	if (refreshToken && isAuthRoute) {
		return NextResponse.redirect(new URL('/projects', request.url))
	}

	return NextResponse.next()
}

export const config: ProxyConfig = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
