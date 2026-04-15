import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type TeamsPageViewE2eMockState = {
	mockTeamsPagePush: TestMock
	mockUseTeamsList: TestMock
}

const teamsPageViewE2eMockState = vi.hoisted(
	(): TeamsPageViewE2eMockState => ({
		mockTeamsPagePush: vi.fn(),
		mockUseTeamsList: vi.fn(),
	}),
)

export const mockTeamsPagePush: TestMock = teamsPageViewE2eMockState.mockTeamsPagePush
export const mockUseTeamsList: TestMock = teamsPageViewE2eMockState.mockUseTeamsList

export function resetTeamsPageViewE2eMocks() {
	vi.clearAllMocks()
}

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockTeamsPagePush }),
}))

vi.mock('@/views/teams/ui/team-card', () => ({
	TeamCard: ({
		onOpen,
		team,
	}: {
		onOpen?: (team: { id: string; name: string }) => void
		team: { id: string; name: string }
	}) => (
		<button data-testid={`team-card-${team.id}`} onClick={() => onOpen?.(team)}>
			{team.name}
		</button>
	),
}))
