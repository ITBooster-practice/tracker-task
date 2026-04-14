import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES, type MyInvitation, type TeamListItem } from '@repo/types'

import { ProfilePageView } from '@/views/profile/ui/profile-page-view'

const {
	mockPush,
	mockToastInfo,
	mockToastSuccess,
	mockToastError,
	mockAcceptMutateAsync,
	mockDeclineMutateAsync,
	mockUseMe,
	mockUseTeamsList,
	mockUseMyInvitations,
} = vi.hoisted(() => ({
	mockPush: vi.fn(),
	mockToastInfo: vi.fn(),
	mockToastSuccess: vi.fn(),
	mockToastError: vi.fn(),
	mockAcceptMutateAsync: vi.fn(),
	mockDeclineMutateAsync: vi.fn(),
	mockUseMe: vi.fn(),
	mockUseTeamsList: vi.fn(),
	mockUseMyInvitations: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => mockUseMe(),
}))

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('@/shared/api/use-team-invitations', () => ({
	useMyInvitations: () => mockUseMyInvitations(),
	useAcceptInvitation: () => ({
		mutateAsync: mockAcceptMutateAsync,
		isPending: false,
		variables: undefined,
	}),
	useDeclineInvitation: () => ({
		mutateAsync: mockDeclineMutateAsync,
		isPending: false,
		variables: undefined,
	}),
}))

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: (value: unknown) =>
		typeof value === 'object' &&
		value !== null &&
		'message' in value &&
		'statusCode' in value,
}))

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Badge: ({
		children,
	}: React.PropsWithChildren<{ className?: string; variant?: string }>) => (
		<span>{children}</span>
	),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Card: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	CardContent: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	CardHeader: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	CardTitle: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<h2>{children}</h2>
	),
	EmptyState: ({
		title,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
		className?: string
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{action}
		</div>
	),
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: ({
		children,
		...props
	}: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
		<label {...props}>{children}</label>
	),
	Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='skeleton' {...props} />
	),
	cn: (...values: Array<string | false | null | undefined>) =>
		values.filter(Boolean).join(' '),
	toast: {
		info: mockToastInfo,
		success: mockToastSuccess,
		error: mockToastError,
	},
}))

vi.mock('@repo/ui/icons', () => ({
	Check: () => <span />,
	ChevronRight: () => <span />,
	Mail: () => <span />,
	Shield: () => <span />,
	UserRound: () => <span />,
	Users: () => <span />,
	X: () => <span />,
}))

function createTeam(overrides?: Partial<TeamListItem>): TeamListItem {
	return {
		id: 'team-1',
		name: 'Product Team',
		description: null,
		avatarUrl: null,
		membersCount: 5,
		currentUserRole: TEAM_ROLES.OWNER,
		createdAt: '2026-04-10T10:00:00.000Z',
		updatedAt: '2026-04-10T10:00:00.000Z',
		...overrides,
	}
}

function createInvitation(overrides?: Partial<MyInvitation>): MyInvitation {
	return {
		id: 'inv-1',
		email: 'alex@test.dev',
		role: TEAM_ROLES.ADMIN,
		token: 'token-1',
		expiresAt: '2026-04-20T10:00:00.000Z',
		createdAt: '2026-04-10T10:00:00.000Z',
		team: {
			id: 'team-99',
			name: 'Marketing Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-2',
			name: 'Ольга Петрова',
			email: 'olga@test.dev',
		},
		...overrides,
	}
}

describe('ProfilePageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		mockUseMe.mockReturnValue({
			data: { id: 'user-1', name: 'Алексей Петров', email: 'alex@tracker.dev' },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockUseTeamsList.mockReturnValue({
			data: [
				createTeam(),
				createTeam({
					id: 'team-2',
					name: 'Design Squad',
					currentUserRole: TEAM_ROLES.ADMIN,
				}),
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockUseMyInvitations.mockReturnValue({
			data: [createInvitation()],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockAcceptMutateAsync.mockResolvedValue({ id: 'team-99', name: 'Marketing Team' })
		mockDeclineMutateAsync.mockResolvedValue({})
	})

	afterEach(cleanup)

	it('рендерит профиль, команды и приглашения', () => {
		render(<ProfilePageView />)

		expect(screen.getByText('Личный кабинет')).toBeDefined()
		expect(screen.getByDisplayValue('Алексей Петров')).toBeDefined()
		expect(screen.getByDisplayValue('alex@tracker.dev')).toBeDefined()
		expect(screen.getByText('Product Team')).toBeDefined()
		expect(screen.getByText('Marketing Team')).toBeDefined()
	})

	it('клик по команде открывает страницу проектов', () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: /Product Team/i }))

		expect(mockPush).toHaveBeenCalledWith('/teams/team-1/projects')
	})

	it('submit профиля без backend показывает info toast', async () => {
		render(<ProfilePageView />)

		fireEvent.change(screen.getByLabelText('Имя'), {
			target: { value: 'Алексей Петров 2' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

		await waitFor(() => {
			expect(mockToastInfo).toHaveBeenCalledWith(
				'Сохранение профиля подключим после backend-части',
			)
		})
	})

	it('кнопка "Принять" вызывает accept invitation', async () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Принять' }))

		await waitFor(() => {
			expect(mockAcceptMutateAsync).toHaveBeenCalledWith('token-1')
		})
		expect(mockToastSuccess).toHaveBeenCalledWith(
			'Вы присоединились к команде Marketing Team',
		)
	})

	it('кнопка "Отклонить" вызывает decline invitation', async () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }))

		await waitFor(() => {
			expect(mockDeclineMutateAsync).toHaveBeenCalledWith('token-1')
		})
		expect(mockToastSuccess).toHaveBeenCalledWith('Приглашение отклонено')
	})
})
