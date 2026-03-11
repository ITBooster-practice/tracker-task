'use client'

import { ThemeSync } from '@/features/theme'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { queryClient } from '../lib/query-client'
import { SessionProvider } from '../lib/session'

interface Props {
	children: React.ReactNode
}

const Providers = ({ children }: Props) => (
	<QueryClientProvider client={queryClient}>
		<ThemeSync />
		<SessionProvider>{children}</SessionProvider>
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>
)

export { Providers }
