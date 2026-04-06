import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthFormLayout } from '@/views/auth/ui/auth-form-layout'

vi.mock('@repo/ui', () => ({
	Card: ({ children }: React.PropsWithChildren) => (
		<div data-testid='card'>{children}</div>
	),
	CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	CardTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	CardFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

describe('AuthFormLayout', () => {
	afterEach(cleanup)

	it('отображает заголовок', () => {
		render(<AuthFormLayout title='Войдите в аккаунт'>content</AuthFormLayout>)

		expect(screen.getByText('Войдите в аккаунт')).toBeDefined()
	})

	it('отображает children', () => {
		render(
			<AuthFormLayout>
				<span>form fields</span>
			</AuthFormLayout>,
		)

		expect(screen.getByText('form fields')).toBeDefined()
	})

	it('отображает footer', () => {
		render(<AuthFormLayout footer={<button>Войти</button>}>content</AuthFormLayout>)

		expect(screen.getByRole('button', { name: 'Войти' })).toBeDefined()
	})

	it('без title — заголовок пустой', () => {
		render(<AuthFormLayout>content</AuthFormLayout>)

		const heading = screen.getByRole('heading')
		expect(heading.textContent).toBe('')
	})
})
