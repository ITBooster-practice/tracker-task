'use client'

import { useEffect } from 'react'

import { LoaderCircle } from '@repo/ui/icons'

import { initSession } from './session-init'
import { useSessionStore } from './session-store'

interface Props {
	children: React.ReactNode
}

const SessionProvider = ({ children }: Props) => {
	const { status } = useSessionStore()

	useEffect(() => {
		initSession()
	}, [])

	if (status === 'authenticated') {
		return (
			<div className='h-screen flex items-center justify-center'>
				<LoaderCircle className='animate-spin' />
			</div>
		)
	}

	return children
}

export { SessionProvider }
