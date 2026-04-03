import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterPageView } from '@/views/auth/ui/register-page-view'

const { mockRegisterMutateAsync, mockPush } = vi.hoisted(() => ({
	mockRegisterMutateAsync: vi.fn(),
	mockPush: vi.fn(),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useRegister: () => ({
		mutateAsync: mockRegisterMutateAsync,
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

function fillRegisterForm({
	email,
	name,
	password,
	confirmPassword,
}: {
	email: string
	name: string
	password: string
	confirmPassword: string
}) {
	fireEvent.change(screen.getByLabelText('Почта'), {
		target: { value: email },
	})
	fireEvent.change(screen.getByLabelText('Имя'), {
		target: { value: name },
	})
	fireEvent.change(screen.getByLabelText('Пароль'), {
		target: { value: password },
	})
	fireEvent.change(screen.getByLabelText('Подтверждение пароля'), {
		target: { value: confirmPassword },
	})
}

describe('RegisterPageView e2e', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('рендерит 4 поля', () => {
		render(<RegisterPageView />)

		expect(screen.getByLabelText('Почта')).toBeDefined()
		expect(screen.getByLabelText('Имя')).toBeDefined()
		expect(screen.getByLabelText('Пароль')).toBeDefined()
		expect(screen.getByLabelText('Подтверждение пароля')).toBeDefined()
	})

	it('пароли не совпадают: показывает ошибку confirmPassword и не вызывает запрос', async () => {
		render(<RegisterPageView />)

		fillRegisterForm({
			email: 'user@example.com',
			name: 'Иван',
			password: 'password123',
			confirmPassword: 'different123',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

		await waitFor(() => {
			expect(screen.getByText('Пароли не совпадают.')).toBeDefined()
		})

		expect(mockRegisterMutateAsync).not.toHaveBeenCalled()
	})

	it('успешный submit вызывает useRegister с правильными данными', async () => {
		mockRegisterMutateAsync.mockResolvedValue({})
		render(<RegisterPageView />)

		fillRegisterForm({
			email: 'user@example.com',
			name: 'Иван',
			password: 'password123',
			confirmPassword: 'password123',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

		await waitFor(() => {
			expect(mockRegisterMutateAsync).toHaveBeenCalledWith({
				email: 'user@example.com',
				name: 'Иван',
				password: 'password123',
				confirmPassword: 'password123',
			})
		})
	})

	it('слишком короткий пароль показывает ошибку валидации до запроса', async () => {
		render(<RegisterPageView />)

		fillRegisterForm({
			email: 'user@example.com',
			name: 'Иван',
			password: '12345',
			confirmPassword: '12345',
		})

		fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

		await waitFor(() => {
			expect(screen.getAllByText('Пароль должен быть не менее 6 символов')).toHaveLength(
				2,
			)
		})

		expect(mockRegisterMutateAsync).not.toHaveBeenCalled()
	})
})
