import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserStore } from '@/entities/user'
import { authKeys, useLogin, useLogout, useMe, useRegister } from '@/shared/api/use-auth'
import { authService, type AuthResponse, type User } from '@/shared/lib/api/auth-service'

vi.mock('@/shared/lib/api/auth-service', () => ({
	authService: {
		login: vi.fn(),
		register: vi.fn(),
		logout: vi.fn(),
		getMe: vi.fn(),
	},
}))

const createWrapper = (queryClient: QueryClient) => {
	const QueryClientWrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)

	QueryClientWrapper.displayName = 'UseAuthQueryClientWrapper'

	return QueryClientWrapper
}

describe('use-auth hooks', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		vi.clearAllMocks()
		useUserStore.getState().clearUser()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	describe('useRegister', () => {
		it('mutationFn вызывает authService.register', async () => {
			vi.mocked(authService.getMe).mockResolvedValue({
				id: '1',
				email: 'test@test.com',
				name: 'Ivan',
			} as User)
			vi.mocked(authService.register).mockResolvedValue({
				user: { id: '1', email: 'test@test.com', name: 'Ivan' },
				accessToken: 'token',
			} as AuthResponse)

			const { result } = renderHook(() => useRegister(), {
				wrapper: createWrapper(queryClient),
			})

			result.current.mutate({
				email: 'test@test.com',
				password: '123456',
				name: 'Ivan',
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.register).toHaveBeenCalledOnce()
			expect(vi.mocked(authService.register).mock.calls[0]?.[0]).toEqual({
				email: 'test@test.com',
				password: '123456',
				name: 'Ivan',
			})
		})
	})

	describe('useLogin', () => {
		it('mutationFn вызывает authService.login', async () => {
			vi.mocked(authService.getMe).mockResolvedValue({
				id: '1',
				email: 'test@test.com',
				name: null,
			} as User)
			vi.mocked(authService.login).mockResolvedValue({
				user: { id: '1', email: 'test@test.com', name: null },
				accessToken: 'token',
			} as AuthResponse)

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(queryClient),
			})

			result.current.mutate({ email: 'test@test.com', password: '123456' })

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.login).toHaveBeenCalledOnce()
			expect(vi.mocked(authService.login).mock.calls[0]?.[0]).toEqual({
				email: 'test@test.com',
				password: '123456',
			})
		})
	})

	describe('useLogout', () => {
		it("при успехе инвалидирует ['me'] и очищает пользователя", async () => {
			const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
			const clearUser = vi.spyOn(useUserStore.getState(), 'clearUser')

			useUserStore.getState().setUser({
				id: '1',
				email: 'test@test.com',
				name: 'Ivan',
			})
			vi.mocked(authService.logout).mockResolvedValue(undefined)

			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(queryClient),
			})

			result.current.mutate()

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.logout).toHaveBeenCalledOnce()
			expect(clearUser).toHaveBeenCalledOnce()
			expect(invalidateQueries).toHaveBeenCalledWith({
				queryKey: authKeys.getMe,
			})
			expect(useUserStore.getState().user).toBeNull()
		})
	})

	describe('useMe', () => {
		it("queryFn вызывает authService.getMe, а queryKey равен ['me']", async () => {
			vi.mocked(authService.getMe).mockResolvedValue({
				id: '1',
				email: 'test@test.com',
				name: 'Ivan',
			} as User)

			const { result } = renderHook(() => useMe(), {
				wrapper: createWrapper(queryClient),
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.getMe).toHaveBeenCalledOnce()
			expect(result.current.data).toEqual({
				id: '1',
				email: 'test@test.com',
				name: 'Ivan',
			})
			expect(queryClient.getQueryCache().find({ queryKey: ['me'] })).toBeDefined()
		})
	})
})
