import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserStore } from '@/entities/user'
import { authKeys, useLogin, useLogout, useMe, useRegister } from '@/shared/api/use-auth'
import { authService, type AuthResponse, type User } from '@/shared/lib/api/auth-service'
import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

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

const originalLocation = window.location
const assignLogin = vi.fn()

describe('use-auth hooks', () => {
	let queryClient: QueryClient
	afterEach(() => {
		cleanup()
		queryClient.clear()
		Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
	})

	beforeEach(() => {
		vi.clearAllMocks()
		Object.defineProperty(window, 'location', {
			value: { origin: 'http://localhost', assign: assignLogin },
			writable: true,
		})
		useUserStore.getState().clearUser()
		useUserStore.setState({ sessionVersion: 0, sessionEnded: false })
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
		it('clears the user, workspace and private query cache after logout', async () => {
			const clearQueries = vi.spyOn(queryClient, 'clear')
			const clearUser = vi.spyOn(useUserStore.getState(), 'clearUser')

			useUserStore.getState().setUser({
				id: '1',
				email: 'test@test.com',
				name: 'Ivan',
			})
			vi.mocked(authService.logout).mockResolvedValue(undefined)
			useWorkspaceStore.setState({ hydrated: true })
			useWorkspaceStore
				.getState()
				.syncRoute('1', '/teams/team/projects/project', 'team', 'project')
			queryClient.setQueryData(['teams', 'list'], { data: ['private'] })

			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(queryClient),
			})

			result.current.mutate()

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(authService.logout).toHaveBeenCalledOnce()
			expect(assignLogin).toHaveBeenCalledOnce()
			expect(clearUser).toHaveBeenCalledOnce()
			expect(clearQueries).toHaveBeenCalledOnce()
			expect(queryClient.getQueryData(['teams', 'list'])).toBeUndefined()
			expect(useWorkspaceStore.getState()).toMatchObject({
				teamId: null,
				projectId: null,
			})
			expect(useUserStore.getState().user).toBeNull()
		})
	})

	it('fetches a fresh identity after login even when the old account me cache is fresh', async () => {
		const old = { id: 'old', email: 'old@example.test', name: 'Old' }
		const next = { id: 'next', email: 'next@example.test', name: 'Next' }
		queryClient.setDefaultOptions({ queries: { staleTime: Infinity, retry: false } })
		queryClient.setQueryData(authKeys.getMe, old)
		queryClient.setQueryData(['teams', 'list'], { data: ['old private team'] })
		useUserStore.getState().setUser(old)
		vi.mocked(authService.login).mockResolvedValue({
			user: next,
			accessToken: 'test',
		} as AuthResponse)
		vi.mocked(authService.getMe).mockResolvedValue(next as User)
		const { result } = renderHook(() => useLogin(), {
			wrapper: createWrapper(queryClient),
		})
		await act(() =>
			result.current.mutateAsync({ email: next.email, password: 'test password' }),
		)
		expect(authService.getMe).toHaveBeenCalledOnce()
		expect(useUserStore.getState().user?.id).toBe(next.id)
		expect(queryClient.getQueryData(['teams', 'list'])).toBeUndefined()
	})
	it('can recover identity when the secondary me request temporarily fails', async () => {
		const user = { id: 'confirmed', email: 'confirmed@example.test', name: 'Confirmed' }
		vi.mocked(authService.login).mockResolvedValue({
			accessToken: 'test',
		} as AuthResponse)
		vi.mocked(authService.getMe).mockRejectedValue({
			statusCode: 503,
			message: 'Temporary',
		})
		const { result } = renderHook(useLogin, { wrapper: createWrapper(queryClient) })
		await act(() =>
			result.current.mutateAsync({ email: user.email, password: 'test password' }),
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(useUserStore.getState().sessionEnded).toBe(false)
		vi.mocked(authService.getMe).mockResolvedValue(user as User)
		const me = renderHook(useMe, { wrapper: createWrapper(queryClient) })
		await waitFor(() => expect(me.result.current.isSuccess).toBe(true))
		expect(useUserStore.getState().user?.id).toBe(user.id)
		expect(useWorkspaceStore.getState().teamId).toBeNull()
	})
	it('does not resurrect a logged-out user from a late me response', async () => {
		let resolveMe!: (user: User) => void
		vi.mocked(authService.getMe).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveMe = resolve
				}),
		)
		vi.mocked(authService.logout).mockResolvedValue(undefined)
		const { result } = renderHook(() => ({ me: useMe(), logout: useLogout() }), {
			wrapper: createWrapper(queryClient),
		})
		await waitFor(() => expect(authService.getMe).toHaveBeenCalledOnce())
		await act(() => result.current.logout.mutateAsync())
		await act(async () =>
			resolveMe({
				id: 'previous',
				email: 'previous@example.test',
				name: 'Previous',
			} as User),
		)
		expect(useUserStore.getState().user).toBeNull()
		expect(useWorkspaceStore.getState().teamId).toBeNull()
	})
	it('clears the previous account cache when a hydrated me identifies another user', async () => {
		const old = { id: 'old', email: 'old@example.test', name: 'Old' }
		const next = { id: 'next', email: 'next@example.test', name: 'Next' }
		useUserStore.getState().setUser(old)
		queryClient.setDefaultOptions({ queries: { staleTime: Infinity, retry: false } })
		queryClient.setQueryData(authKeys.getMe, next)
		queryClient.setQueryData(['projects', 'old'], { private: true })
		const { result } = renderHook(useMe, { wrapper: createWrapper(queryClient) })
		await waitFor(() => expect(useUserStore.getState().user?.id).toBe(next.id))
		expect(result.current.data?.id).toBe(next.id)
		expect(queryClient.getQueryData(['projects', 'old'])).toBeUndefined()
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
