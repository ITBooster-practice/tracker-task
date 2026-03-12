'use client'

import { buildLoginHref } from '@/shared/config/routes'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSessionStore } from './session-store'

interface Props {
	children: React.ReactNode
}

const ProtectedRouteGuard = ({ children }: Props) => {
	const router = useRouter()
	const pathname = usePathname()
	const status = useSessionStore((state) => state.status)

	useEffect(() => {
		if (status === 'guest') {
			router.replace(buildLoginHref(pathname))
		}
	}, [pathname, router, status])

	if (status !== 'authenticated') {
		return null
	}

	return children
}

export { ProtectedRouteGuard }
