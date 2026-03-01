import { FEATURES } from '@/hooks/use-feature-flag'
import { NextResponse, type NextRequest, type ProxyConfig } from 'next/server'

export function proxy(request: NextRequest): NextResponse {
	if (!FEATURES.AUTH_DISABLE) {
		return NextResponse.next()
	}

	// TODO: Интеграция с User store
	// - Валидация токена через API / JWT decode
	// - Синхронизация с клиентским auth state
	const token = request.cookies.get('token')?.value
	if (!token) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config: ProxyConfig = {
	matcher: [],
}
