import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type TeamsPageViewUnitMockState = {
	mockTeamsPagePush: TestMock
	mockUseTeamsPage: TestMock
}

const teamsPageViewUnitMockState = vi.hoisted(
	(): TeamsPageViewUnitMockState => ({
		mockTeamsPagePush: vi.fn(),
		mockUseTeamsPage: vi.fn(),
	}),
)

export const mockTeamsPagePush: TestMock = teamsPageViewUnitMockState.mockTeamsPagePush
export const mockUseTeamsPage: TestMock = teamsPageViewUnitMockState.mockUseTeamsPage

export function resetTeamsPageViewUnitMocks() {
	vi.clearAllMocks()
}

vi.mock('@/views/teams/model/use-teams-page', () => ({
	useTeamsPage: () => mockUseTeamsPage(),
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
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	CardSkeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='card-skeleton' {...props} />
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
	Pagination: () => <nav data-testid='pagination' />,
	usePagination: () => ({
		page: 1,
		limit: 10,
		setPage: vi.fn(),
		paginationParams: { page: 1, limit: 10 },
	}),
}))

vi.mock('@repo/ui/icons', () => ({
	Plus: () => <span data-testid='plus-icon' />,
	Users: () => <span data-testid='users-icon' />,
	Search: () => <span data-testid='search-icon' />,
	LayoutList: () => <span data-testid='layout-list-icon' />,
	LayoutGrid: () => <span data-testid='layout-grid-icon' />,
}))

vi.mock('@/shared/ui/view-toggle', () => ({
	ViewToggle: () => <div data-testid='view-toggle' />,
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

vi.mock('@/views/teams/ui/team-list-item', () => ({
	TeamListItem: ({
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
