import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPageView } from '@/views/auth/ui/login-page-view'

// vi.hoisted — создаёт переменные ДО hoisting vi.mock
const { mockMutateAsync, mockPush, mockIsApiError, mockToastError, mockSearchParamGet } =
	vi.hoisted(() => ({
		mockMutateAsync: vi.fn(),
		mockPush: vi.fn(),
		mockIsApiError: vi.fn(),
		mockToastError: vi.fn(),
		mockSearchParamGet: vi.fn(),
	}))

vi.mock('@/shared/api/use-auth', () => ({
	useLogin: () => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	}),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => ({
		get: mockSearchParamGet,
	}),
}))

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: mockIsApiError,
	toApiError: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
	Form: ({ children }: React.PropsWithChildren) => <>{children}</>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	toast: { error: mockToastError },
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
		<a href={href}>{children}</a>
	),
}))

vi.mock('@/views/auth/ui/auth-form-layout', () => ({
	AuthFormLayout: ({
		title,
		children,
		footer,
	}: {
		title?: React.ReactNode
		children: React.ReactNode
		footer?: React.ReactNode
	}) => (
		<div>
			<h1>{title}</h1>
			{children}
			{footer}
		</div>
	),
}))

vi.mock('@/views/auth/ui/login-form', () => ({
	LoginForm: () => <div data-testid='login-form-fields' />,
}))

vi.mock('@/views/auth/model/use-login-form', () => ({
	useLoginForm: () => ({
		handleSubmit:
			(fn: (data: { email: string; password: string }) => void) =>
			(e: { preventDefault: () => void }) => {
				e.preventDefault()
				fn({ email: 'test@example.com', password: 'password123' })
			},
		formState: { isSubmitting: false },
		control: {},
	}),
}))

describe('LoginPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockSearchParamGet.mockReturnValue(null)
	})

	afterEach(cleanup)

	it('отображает заголовок формы', () => {
		render(<LoginPageView />)

		expect(screen.getByText('Войдите в свой аккаунт')).toBeDefined()
	})

	it('отображает кнопку входа', () => {
		render(<LoginPageView />)

		expect(screen.getByRole('button', { name: 'Войти' })).toBeDefined()
	})

	it('отображает ссылку на регистрацию', () => {
		render(<LoginPageView />)

		expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toBeDefined()
	})

	it('успешный submit — вызывает mutateAsync с данными формы', async () => {
		mockMutateAsync.mockResolvedValue({})
		render(<LoginPageView />)

		fireEvent.submit(screen.getByRole('button', { name: 'Войти' }).closest('form')!)

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
			})
		})
	})

	it('успешный submit — редирект на страницу команд', async () => {
		mockMutateAsync.mockResolvedValue({})
		render(<LoginPageView />)

		fireEvent.submit(screen.getByRole('button', { name: 'Войти' }).closest('form')!)

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/teams')
		})
	})

	it('сохраняет параметр from для ссылки на регистрацию', () => {
		mockSearchParamGet.mockReturnValue('/invitations/token-1')

		render(<LoginPageView />)

		expect(
			screen.getByRole('link', { name: 'Зарегистрироваться' }).getAttribute('href'),
		).toBe('/register?from=%2Finvitations%2Ftoken-1')
	})

	it('API ошибка — показывает toast.error с сообщением', async () => {
		const apiError = { message: 'Неверный логин или пароль', statusCode: 401 }
		mockMutateAsync.mockRejectedValue(apiError)
		mockIsApiError.mockReturnValue(true)

		render(<LoginPageView />)
		fireEvent.submit(screen.getByRole('button', { name: 'Войти' }).closest('form')!)

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith('Неверный логин или пароль')
		})
	})
})
