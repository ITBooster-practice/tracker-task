import { FEATURES } from '@/hooks/use-feature-flag'
import { notFound } from 'next/navigation'

import { HStack } from '@repo/ui'

interface Props {
	children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
	if (!FEATURES.AUTH) {
		notFound()
	}

	return (
		<HStack align='center' justify='center' className='min-h-screen bg-background'>
			{children}
		</HStack>
	)
}
