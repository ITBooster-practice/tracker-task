import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTeamDialog } from '@/views/teams/ui/create-team-dialog'

const { mockMutateAsync, mockReplace, mockIsPending } = vi.hoisted(() => ({
	mockMutateAsync: vi.fn(),
	mockReplace: vi.fn(),
	mockIsPending: { value: false },
}))

vi.mock('@/shared/api/use-teams', () => ({
	useCreateTeam: () => ({
		mutateAsync: mockMutateAsync,
		get isPending() {
			return mockIsPending.value
		},
	}),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
}))

describe('CreateTeamDialog e2e', () => {
	const originalMatchMedia = window.matchMedia

	beforeEach(() => {
		vi.clearAllMocks()
		mockIsPending.value = false
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: query === '(min-width: 768px)',
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		})
	})

	afterEach(() => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: originalMatchMedia,
		})
		cleanup()
	})

	it('рендерит поле name', () => {
		render(<CreateTeamDialog />)

		expect(screen.getByLabelText('Название команды')).toBeDefined()
	})

	it('пустое имя не даёт отправить форму', () => {
		render(<CreateTeamDialog />)

		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(mockMutateAsync).not.toHaveBeenCalled()
	})

	it('успешный сабмит вызывает useCreateTeam.mutate с { name }', async () => {
		mockMutateAsync.mockResolvedValue({ id: 'team-1', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByLabelText('Название команды'), {
			target: { value: '  Design Team  ' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({ name: 'Design Team' })
		})
	})

	it('после успеха диалог закрывается', async () => {
		mockMutateAsync.mockResolvedValue({ id: 'team-1', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByLabelText('Название команды'), {
			target: { value: 'Design Team' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/teams')
		})
	})
})
