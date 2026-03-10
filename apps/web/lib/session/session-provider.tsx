'use client'

import { useEffect } from 'react'

import { Loader } from '@repo/ui/icons'

import { initSession } from './session-init'
import { useSessionStore } from './session-store'

interface Props {
	children: React.ReactNode
}

const SessionProvider = ({ children }: Props) => {
	const { status } = useSessionStore()

	useEffect(() => {
		initSession()
	}, [initSession])

	if (status === 'unknown') {
		return <Loader className='animate-spin' />
	}

	return children
}

export { SessionProvider }
