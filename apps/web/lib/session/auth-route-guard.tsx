'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSessionStore } from './session-store'

interface Props {
	children: React.ReactNode
}

const AuthRouteGuard = ({ children }: Props) => {
	const router = useRouter()
	const status = useSessionStore((state) => state.status)

	useEffect(() => {
		if (status === 'authenticated') {
			router.replace('/projects')
		}
	}, [router, status])

	if (status !== 'guest') {
		return null
	}

	return children
}

export { AuthRouteGuard }
