'use client'

import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'

import { useUserStore } from '@/entities/user'
import { authService, type User } from '@/shared/lib/api/auth-service'

import { authKeys } from './auth-keys'

export { authKeys } from './auth-keys'

const syncCurrentUser = async (queryClient: ReturnType<typeof useQueryClient>) => {
	useUserStore.getState().clearUser()
	const version = useUserStore.getState().sessionVersion
	await queryClient.cancelQueries()
	if (useUserStore.getState().sessionVersion !== version) return
	queryClient.clear()
	useUserStore.getState().startSession()
	try {
		await queryClient.fetchQuery({
			queryKey: authKeys.getMe,
			queryFn: fetchCurrentUser,
			staleTime: 0,
		})
	} catch {
		// Сессия уже установлена, поэтому не ломаем login/register из-за вторичного запроса.
	}
}

const applyCurrentUser = (queryClient: QueryClient, user: User, version: number) => {
	const state = useUserStore.getState()
	if (state.sessionVersion !== version) return
	if (state.user && state.user.id !== user.id) {
		state.clearUser()
		const protectedQueries = {
			predicate: (query: { queryKey: readonly unknown[] }) =>
				query.queryKey[0] !== authKeys.getMe[0],
		}
		void queryClient.cancelQueries(protectedQueries)
		queryClient.removeQueries(protectedQueries)
	}
	useUserStore.getState().setUser(user)
}

const fetchCurrentUser = async ({
	signal,
	client,
}: {
	signal: AbortSignal
	client: QueryClient
}) => {
	const version = useUserStore.getState().sessionVersion
	const user = await authService.getMe({ signal })
	if (!signal.aborted) applyCurrentUser(client, user, version)
	return user
}

export const useRegister = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: authKeys.register,
		mutationFn: authService.register,
		onSuccess: async () => syncCurrentUser(queryClient),
	})
}

export const useLogin = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: authKeys.login,
		mutationFn: authService.login,
		onSuccess: async () => syncCurrentUser(queryClient),
	})
}

export const useLogout = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: authKeys.logout,
		mutationFn: authService.logout,
		onSuccess: async () => {
			useUserStore.getState().clearUser()
			await queryClient.cancelQueries()
			queryClient.clear()
		},
	})
}

export const useMe = () => {
	const sessionEnded = useUserStore((state) => state.sessionEnded)
	const queryClient = useQueryClient()
	const query = useQuery({
		queryKey: authKeys.getMe,
		queryFn: fetchCurrentUser,
		enabled: !sessionEnded,
	})
	useEffect(() => {
		const state = useUserStore.getState()
		if (query.data && !state.sessionEnded)
			applyCurrentUser(queryClient, query.data, state.sessionVersion)
	}, [query.data, queryClient])
	return query
}
