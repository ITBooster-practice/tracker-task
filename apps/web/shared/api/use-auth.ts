import { authService } from '@/shared/lib/api/auth-service'
import { useMutation, useQuery } from '@tanstack/react-query'

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
	return useMutation({
		mutationKey: authKeys.logout,
		mutationFn: authService.logout,
	})
}

export const useMe = () => {
	return useQuery({
		queryKey: authKeys.getMe,
		queryFn: authService.getMe,
	})
}
