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
		return (
			<div className='h-screen flex items-center justify-center'>
				<Loader className='animate-spin' />
			</div>
		)
	}

	return children
}

export { SessionProvider }
