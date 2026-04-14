import {
	installDesktopMatchMediaMock,
	restoreMatchMediaMock,
} from '@/test/mocks/browser/match-media.mock'
import {
	mockCreateTeamMutateAsync,
	mockRouterReplace,
	resetCreateTeamDialogE2eMocks,
} from '@/test/mocks/views/teams/create-team-dialog.e2e.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CreateTeamDialog } from '@/views/teams/ui/create-team-dialog'

describe('CreateTeamDialog e2e', () => {
	beforeEach(() => {
		resetCreateTeamDialogE2eMocks()
		installDesktopMatchMediaMock()
	})

	afterEach(() => {
		restoreMatchMediaMock()
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
		expect(mockCreateTeamMutateAsync).not.toHaveBeenCalled()
	})

	it('успешный сабмит вызывает useCreateTeam.mutate с { name }', async () => {
		mockCreateTeamMutateAsync.mockResolvedValue({ id: 'team-1', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByLabelText('Название команды'), {
			target: { value: '  Design Team  ' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => {
			expect(mockCreateTeamMutateAsync).toHaveBeenCalledWith({ name: 'Design Team' })
		})
	})

	it('после успеха диалог закрывается', async () => {
		mockCreateTeamMutateAsync.mockResolvedValue({ id: 'team-1', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByLabelText('Название команды'), {
			target: { value: 'Design Team' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => {
			expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
		})
	})
})
