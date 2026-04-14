import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserStore } from '@/entities/user'
import { authService } from '@/shared/lib/api/auth-service'

export const authKeys = {
	register: ['register'],
	login: ['login'],
	logout: ['logout'],
	getMe: ['me'],
} as const

const syncCurrentUser = async (queryClient: ReturnType<typeof useQueryClient>) => {
	try {
		const user = await queryClient.fetchQuery({
			queryKey: authKeys.getMe,
			queryFn: authService.getMe,
		})
		useUserStore.getState().setUser(user)
	} catch {
		// Сессия уже установлена, поэтому не ломаем login/register из-за вторичного запроса.
	}
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
			await queryClient.invalidateQueries({ queryKey: authKeys.getMe })
		},
	})
}

export const useMe = () => {
	return useQuery({
		queryKey: authKeys.getMe,
		queryFn: async () => {
			const user = await authService.getMe()
			useUserStore.getState().setUser(user)
			return user
		},
	})
}
