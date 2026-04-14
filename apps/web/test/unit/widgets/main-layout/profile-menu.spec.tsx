import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileMenu } from '@/widgets/main-layout/ui/header/profile-menu'

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
const mockPush = vi.fn()

vi.mock('@/shared/api/use-auth', () => ({
	useLogout: () => ({ mutateAsync: mockMutateAsync }),
	useMe: () => ({ data: { name: 'Тест Юзер', email: 'test@example.com' } }),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DropdownMenuItem: ({
		children,
		onClick,
	}: React.PropsWithChildren<{ onClick?: () => void; variant?: string }>) => (
		<button onClick={onClick}>{children}</button>
	),
	DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})

	return ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('ProfileMenu', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('отображает имя пользователя из API', () => {
		render(<ProfileMenu />, { wrapper: createWrapper() })

		expect(screen.getByText('Тест Юзер')).toBeDefined()
	})

	it('отображает аватар', () => {
		render(<ProfileMenu />, { wrapper: createWrapper() })

		// getAllByText — потому что аватар рендерится дважды
		expect(screen.getAllByText('ТЮ')).toHaveLength(2)
	})

	it('отображает пункты меню', () => {
		render(<ProfileMenu />, { wrapper: createWrapper() })

		expect(screen.getByText('Личный кабинет')).toBeDefined()
		expect(screen.getByText('Выйти')).toBeDefined()
	})

	it('клик по "Личный кабинет" открывает страницу профиля', () => {
		render(<ProfileMenu />, { wrapper: createWrapper() })

		fireEvent.click(screen.getByText('Личный кабинет'))

		expect(mockPush).toHaveBeenCalledWith('/profile')
	})

	it('клик "Выйти" вызывает logout и редиректит', () => {
		const assignMock = vi.fn()
		const originalLocation = window.location

		Object.defineProperty(window, 'location', {
			value: { ...originalLocation, assign: assignMock, origin: 'http://localhost' },
			writable: true,
		})

		render(<ProfileMenu />, { wrapper: createWrapper() })
		fireEvent.click(screen.getByText('Выйти'))

		expect(mockMutateAsync).toHaveBeenCalledOnce()
		expect(assignMock).toHaveBeenCalledOnce()

		const redirectUrl = String(assignMock.mock.calls[0]?.[0])
		expect(redirectUrl).toContain('clearAuth=1')

		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		})
	})
})
