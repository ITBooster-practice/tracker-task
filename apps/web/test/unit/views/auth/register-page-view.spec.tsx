import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterPageView } from '@/views/auth/ui/register-page-view'

const { mockMutateAsync, mockPush, mockIsApiError, mockToastError, mockSearchParamGet } =
	vi.hoisted(() => ({
		mockMutateAsync: vi.fn(),
		mockPush: vi.fn(),
		mockIsApiError: vi.fn(),
		mockToastError: vi.fn(),
		mockSearchParamGet: vi.fn(),
	}))

vi.mock('@/shared/api/use-auth', () => ({
	useRegister: () => ({
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

vi.mock('@/views/auth/ui/register-form', () => ({
	RegisterForm: () => <div data-testid='register-form-fields' />,
}))

vi.mock('@/views/auth/model/use-register-form', () => ({
	useRegisterForm: () => ({
		handleSubmit:
			(
				fn: (data: {
					email: string
					password: string
					confirmPassword: string
					name: string
				}) => void,
			) =>
			(e: { preventDefault: () => void }) => {
				e.preventDefault()
				fn({
					email: 'user@example.com',
					password: 'pass123',
					confirmPassword: 'pass123',
					name: 'Иван',
				})
			},
		formState: { isSubmitting: false },
		control: {},
	}),
}))

describe('RegisterPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockSearchParamGet.mockReturnValue(null)
	})

	afterEach(cleanup)

	it('отображает заголовок формы', () => {
		render(<RegisterPageView />)

		expect(screen.getByText('Регистрация')).toBeDefined()
	})

	it('отображает кнопку регистрации', () => {
		render(<RegisterPageView />)

		expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toBeDefined()
	})

	it('отображает ссылку на страницу входа', () => {
		render(<RegisterPageView />)

		expect(screen.getByRole('link', { name: 'Войти' })).toBeDefined()
	})

	it('успешный submit — вызывает mutateAsync с данными формы', async () => {
		mockMutateAsync.mockResolvedValue({})
		render(<RegisterPageView />)

		fireEvent.submit(
			screen.getByRole('button', { name: 'Зарегистрироваться' }).closest('form')!,
		)

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				email: 'user@example.com',
				password: 'pass123',
				confirmPassword: 'pass123',
				name: 'Иван',
			})
		})
	})

	it('успешный submit — редирект на страницу команд', async () => {
		mockMutateAsync.mockResolvedValue({})
		render(<RegisterPageView />)

		fireEvent.submit(
			screen.getByRole('button', { name: 'Зарегистрироваться' }).closest('form')!,
		)

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/teams')
		})
	})

	it('сохраняет параметр from для ссылки на вход', () => {
		mockSearchParamGet.mockReturnValue('/invitations/token-1')

		render(<RegisterPageView />)

		expect(screen.getByRole('link', { name: 'Войти' }).getAttribute('href')).toBe(
			'/login?from=%2Finvitations%2Ftoken-1',
		)
	})

	it('API ошибка — показывает toast.error с сообщением', async () => {
		const apiError = { message: 'Email уже занят', statusCode: 409 }
		mockMutateAsync.mockRejectedValue(apiError)
		mockIsApiError.mockReturnValue(true)

		render(<RegisterPageView />)
		fireEvent.submit(
			screen.getByRole('button', { name: 'Зарегистрироваться' }).closest('form')!,
		)

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith('Email уже занят')
		})
	})
})
