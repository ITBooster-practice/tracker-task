import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type CreateTeamDialogE2eMockState = {
	mockCreateTeamMutateAsync: TestMock
	mockRouterReplace: TestMock
	mockTeamCreatePendingState: { value: boolean }
}

const createTeamDialogE2eMockState = vi.hoisted(
	(): CreateTeamDialogE2eMockState => ({
		mockCreateTeamMutateAsync: vi.fn(),
		mockRouterReplace: vi.fn(),
		mockTeamCreatePendingState: { value: false },
	}),
)

export const mockCreateTeamMutateAsync: TestMock =
	createTeamDialogE2eMockState.mockCreateTeamMutateAsync
export const mockRouterReplace: TestMock = createTeamDialogE2eMockState.mockRouterReplace
export const mockTeamCreatePendingState =
	createTeamDialogE2eMockState.mockTeamCreatePendingState

export function resetCreateTeamDialogE2eMocks() {
	vi.clearAllMocks()
	mockTeamCreatePendingState.value = false
}

vi.mock('@/shared/api/use-teams', () => ({
	useCreateTeam: () => ({
		mutateAsync: mockCreateTeamMutateAsync,
		get isPending() {
			return mockTeamCreatePendingState.value
		},
	}),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockRouterReplace }),
}))
