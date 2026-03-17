import { isServer, QueryClient } from '@tanstack/react-query'

const makeQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
		},
	})
}

let browserQueryClient: QueryClient | null = null

const getQueryClient = () => {
	if (isServer) {
		return makeQueryClient()
	}

	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient()
	}

	return browserQueryClient
}

const queryClient = new QueryClient()

export { queryClient, getQueryClient }
