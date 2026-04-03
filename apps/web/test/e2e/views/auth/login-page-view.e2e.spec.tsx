import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from '@repo/ui'

import { LoginPageView } from '@/views/auth/ui/login-page-view'

const { mockLoginMutateAsync, mockPush } = vi.hoisted(() => ({
	mockLoginMutateAsync: vi.fn(),
	mockPush: vi.fn(),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useLogin: () => ({
		mutateAsync: mockLoginMutateAsync,
		isPending: false,
	}),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
		<a href={href}>{children}</a>
	),
}))

function fillLoginForm({ email, password }: { email: string; password: string }) {
	fireEvent.change(screen.getByLabelText('Почта'), {
		target: { value: email },
	})
	fireEvent.change(screen.getByLabelText('Пароль'), {
		target: { value: password },
	})
}

describe('LoginPageView e2e', () => {
	let toastErrorSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		vi.clearAllMocks()
		toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(vi.fn())
	})

	afterEach(() => {
		toastErrorSpy.mockRestore()
		cleanup()
	})

	it('рендерит поля email и password', () => {
		render(<LoginPageView />)

		expect(screen.getByLabelText('Почта')).toBeDefined()
		expect(screen.getByLabelText('Пароль')).toBeDefined()
	})

	it('отправка пустой формы показывает 2 ошибки валидации и не вызывает запрос', async () => {
		render(<LoginPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

		await waitFor(() => {
			expect(screen.getByText('Email некорректный')).toBeDefined()
			expect(screen.getByText('Пароль должен быть не менее 6 символов')).toBeDefined()
		})

		expect(mockLoginMutateAsync).not.toHaveBeenCalled()
	})

	it('успешный submit вызывает useLogin с правильными данными', async () => {
		mockLoginMutateAsync.mockResolvedValue({})
		render(<LoginPageView />)

		fillLoginForm({
			email: 'user@example.com',
			password: 'password123',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

		await waitFor(() => {
			expect(mockLoginMutateAsync).toHaveBeenCalledWith({
				email: 'user@example.com',
				password: 'password123',
			})
		})
	})

	it('при ошибке API показывает toast с сообщением', async () => {
		mockLoginMutateAsync.mockRejectedValue({
			message: 'Неверный логин или пароль',
			statusCode: 401,
		})
		render(<LoginPageView />)

		fillLoginForm({
			email: 'user@example.com',
			password: 'password123',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

		await waitFor(() => {
			expect(toastErrorSpy).toHaveBeenCalledWith('Неверный логин или пароль')
		})
		expect(mockPush).not.toHaveBeenCalled()
	})
})
