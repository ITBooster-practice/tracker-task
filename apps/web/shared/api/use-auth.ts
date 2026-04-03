import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserStore } from '@/entities/user'
import { authService } from '@/shared/lib/api/auth-service'

export const authKeys = {
	register: ['register'],
	login: ['login'],
	logout: ['logout'],
	getMe: ['me'],
} as const

export const useRegister = () => {
	return useMutation({
		mutationKey: authKeys.register,
		mutationFn: authService.register,
	})
}

export const useLogin = () => {
	return useMutation({
		mutationKey: authKeys.login,
		mutationFn: authService.login,
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
		queryFn: authService.getMe,
	})
}
