import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProfileLink } from '@/widgets/main-layout/ui/header/profile-link'

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => ({ data: { name: 'Тест Юзер', email: 'test@example.com' } }),
}))

afterEach(cleanup)

describe('ProfileLink', () => {
	it('links the avatar directly to the profile without opening a menu', () => {
		render(<ProfileLink />)
		const link = screen.getByRole('link', { name: 'Личный кабинет' })
		expect(link.getAttribute('href')).toBe('/profile')
		expect(link.getAttribute('title')).toBe('Тест Юзер')
		expect(screen.getByText('ТЮ')).toBeDefined()
		expect(screen.queryByRole('button')).toBeNull()
		link.focus()
		expect(document.activeElement).toBe(link)
	})
})
