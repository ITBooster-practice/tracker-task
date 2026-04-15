import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type TeamsPageViewUnitMockState = {
	mockTeamsPagePush: TestMock
	mockUseTeamsList: TestMock
}

const teamsPageViewUnitMockState = vi.hoisted(
	(): TeamsPageViewUnitMockState => ({
		mockTeamsPagePush: vi.fn(),
		mockUseTeamsList: vi.fn(),
	}),
)

export const mockTeamsPagePush: TestMock = teamsPageViewUnitMockState.mockTeamsPagePush
export const mockUseTeamsList: TestMock = teamsPageViewUnitMockState.mockUseTeamsList

export function resetTeamsPageViewUnitMocks() {
	vi.clearAllMocks()
}

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockTeamsPagePush }),
}))

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='skeleton' {...props} />
	),
	EmptyState: ({
		action,
		title,
	}: {
		action?: React.ReactNode
		className?: string
		description?: string
		icon?: React.ReactNode
		title: string
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{action}
		</div>
	),
}))

vi.mock('@repo/ui/icons', () => ({
	Plus: () => <span data-testid='plus-icon' />,
	Users: () => <span data-testid='users-icon' />,
}))

vi.mock('@/views/teams/ui/team-card', () => ({
	TeamCard: ({
		onOpen,
		team,
	}: {
		onOpen: (team: { id: string; name: string }) => void
		team: { id: string; name: string }
	}) => (
		<button data-testid={`team-card-${team.id}`} onClick={() => onOpen(team)}>
			{team.name}
		</button>
	),
}))
