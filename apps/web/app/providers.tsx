'use client'

import { ThemeSync } from '@/features/theme'
import { getQueryClient } from '@/shared/lib/query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface Props {
	children: React.ReactNode
}

const Providers = ({ children }: Props) => (
	<QueryClientProvider client={getQueryClient()}>
		<ThemeSync />
		{children}
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>
)

export { Providers }
