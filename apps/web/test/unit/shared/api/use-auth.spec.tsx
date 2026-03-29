import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogin, useLogout, useMe } from '@/shared/api/use-auth'
import { AuthResponse, authService, User } from '@/shared/lib/api/auth-service'

vi.mock('@/shared/lib/api/auth-service', () => ({
	authService: {
		login: vi.fn(),
		register: vi.fn(),
		logout: vi.fn(),
		getMe: vi.fn(),
	},
}))

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})
	return ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('use-auth hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('useLogin', () => {
		it('вызывает authService.login при мутации', async () => {
			vi.mocked(authService.login).mockResolvedValue({
				user: { id: '1' },
			} as unknown as AuthResponse)

			const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

			result.current.mutate({ email: 'test@test.com', password: '123' })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.login).toHaveBeenCalledOnce()
			expect(authService.login).toHaveBeenCalledWith(
				{
					email: 'test@test.com',
					password: '123',
				},
				expect.anything(),
			)
		})
	})

	describe('useMe', () => {
		it('вызывает authService.getMe и возвращает данные', async () => {
			vi.mocked(authService.getMe).mockResolvedValue({ id: '1', name: 'Ivan' } as User)

			const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })

			// Ждём, пока Query загрузит данные
			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.getMe).toHaveBeenCalledOnce()
			expect(result.current.data).toEqual({ id: '1', name: 'Ivan' })
		})
	})

	describe('useLogout', () => {
		it('вызывает authService.logout', async () => {
			vi.mocked(authService.logout).mockResolvedValue(undefined)

			const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() })

			result.current.mutate()

			await waitFor(() => expect(result.current.isSuccess).toBe(true))
			expect(authService.logout).toHaveBeenCalledOnce()
		})
	})
})
