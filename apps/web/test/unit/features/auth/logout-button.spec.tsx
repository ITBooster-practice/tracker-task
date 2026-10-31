import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoutButton } from '@/features/auth'
import { useUserStore } from '@/entities/user'
import { authService } from '@/shared/lib/api/auth-service'
import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

const errorToast = vi.hoisted(() => vi.fn())
vi.mock('@repo/ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@repo/ui')>()),
	toast: { error: errorToast },
}))
vi.mock('@/shared/lib/api/auth-service', () => ({ authService: { logout: vi.fn() } }))

const originalLocation = window.location
const assign = vi.fn()
const user = { id: 'account-1', name: 'Test User', email: 'test@example.com' }
let client: QueryClient
function mount() {
	client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
	client.setQueryData(['private'], { secret: 'account data' })
	return render(
		<QueryClientProvider client={client}>
			<LogoutButton iconOnly />
			<LogoutButton />
		</QueryClientProvider>,
	)
}

beforeEach(() => {
	vi.clearAllMocks()
	Object.defineProperty(window, 'location', {
		value: { origin: 'http://localhost', assign },
		writable: true,
	})
	useWorkspaceStore.setState({ hydrated: true })
	useUserStore.getState().setUser(user)
	useWorkspaceStore
		.getState()
		.syncRoute(user.id, '/teams/team/projects/project', 'team', 'project')
})
afterEach(() => {
	cleanup()
	client?.clear()
	Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
	vi.restoreAllMocks()
})

describe('LogoutButton shared flow', () => {
	it('waits for the request and cache cleanup before redirecting, disabling every logout action', async () => {
		let resolveRequest!: () => void
		vi.mocked(authService.logout).mockReturnValue(
			new Promise<void>((resolve) => {
				resolveRequest = resolve
			}),
		)
		mount()
		let resolveCleanup!: () => void
		const cancel = vi.spyOn(client, 'cancelQueries').mockReturnValue(
			new Promise<void>((resolve) => {
				resolveCleanup = resolve
			}),
		)
		const buttons = screen.getAllByRole('button', { name: 'Выйти' })
		fireEvent.click(buttons[0]!)
		fireEvent.click(buttons[1]!)
		await waitFor(() => expect(authService.logout).toHaveBeenCalledOnce())
		for (const button of buttons)
			expect((button as HTMLButtonElement).disabled).toBe(true)
		expect(assign).not.toHaveBeenCalled()
		expect(cancel).not.toHaveBeenCalled()
		expect(useUserStore.getState().user).toEqual(user)
		await act(async () => resolveRequest())
		expect(cancel).toHaveBeenCalledOnce()
		expect(client.getQueryData(['private'])).toBeDefined()
		expect(assign).not.toHaveBeenCalled()
		await act(async () => resolveCleanup())
		await waitFor(() => expect(assign).toHaveBeenCalledOnce())
		expect(String(assign.mock.calls[0]?.[0])).toBe('http://localhost/login?clearAuth=1')
		expect(client.getQueryData(['private'])).toBeUndefined()
		expect(useUserStore.getState().user).toBeNull()
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: null, projectId: null })
	})

	it('keeps the session on failure, reports the error and allows another attempt', async () => {
		vi.mocked(authService.logout)
			.mockRejectedValueOnce(new Error('Offline'))
			.mockResolvedValueOnce(undefined)
		mount()
		fireEvent.click(screen.getAllByRole('button', { name: 'Выйти' })[0]!)
		await waitFor(() =>
			expect(errorToast).toHaveBeenCalledWith('Не удалось выйти. Попробуйте ещё раз.'),
		)
		expect(assign).not.toHaveBeenCalled()
		expect(useUserStore.getState().user).toEqual(user)
		expect(client.getQueryData(['private'])).toBeDefined()
		const retry = screen.getAllByRole('button', { name: 'Выйти' })[1]!
		expect((retry as HTMLButtonElement).disabled).toBe(false)
		fireEvent.click(retry)
		await waitFor(() => expect(assign).toHaveBeenCalledOnce())
		expect(authService.logout).toHaveBeenCalledTimes(2)
	})
})
