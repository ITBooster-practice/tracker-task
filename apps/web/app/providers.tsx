'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { queryClient } from '../lib/query-client'

interface Props {
	children: React.ReactNode
}

const Providers = ({ children }: Props) => (
	<QueryClientProvider client={queryClient}>
		{children}
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>
)

export { Providers }
