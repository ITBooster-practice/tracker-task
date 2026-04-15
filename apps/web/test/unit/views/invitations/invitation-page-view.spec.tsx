import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES, type MyInvitation } from '@repo/types'

import { InvitationPageView } from '@/views/invitations/ui/invitation-page-view'

const {
	mockReplace,
	mockPush,
	mockSearchParamGet,
	mockUseMyInvitations,
	mockAcceptMutateAsync,
	mockDeclineMutateAsync,
	mockToastSuccess,
	mockToastError,
} = vi.hoisted(() => ({
	mockReplace: vi.fn(),
	mockPush: vi.fn(),
	mockSearchParamGet: vi.fn(),
	mockUseMyInvitations: vi.fn(),
	mockAcceptMutateAsync: vi.fn(),
	mockDeclineMutateAsync: vi.fn(),
	mockToastSuccess: vi.fn(),
	mockToastError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		replace: mockReplace,
	}),
	useSearchParams: () => ({
		get: mockSearchParamGet,
	}),
}))

vi.mock('@/shared/api/use-team-invitations', () => ({
	useMyInvitations: (options?: { enabled?: boolean }) => mockUseMyInvitations(options),
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
		description,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
		icon?: React.ReactNode
		className?: string
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{description ? <p>{description}</p> : null}
			{action}
		</div>
	),
	Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='skeleton' {...props} />
	),
	toast: {
		success: mockToastSuccess,
		error: mockToastError,
	},
}))

vi.mock('@repo/ui/icons', () => ({
	Check: () => <span />,
	Mail: () => <span />,
	X: () => <span />,
}))

function createInvitation(overrides?: Partial<MyInvitation>): MyInvitation {
	return {
		id: 'inv-1',
		email: 'MadMan1988@yandex.ru',
		role: TEAM_ROLES.MEMBER,
		token: 'token-1',
		expiresAt: '2026-04-20T10:00:00.000Z',
		createdAt: '2026-04-10T10:00:00.000Z',
		team: {
			id: 'team-1',
			name: 'Marketing Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-1',
			name: 'Alex',
			email: 'alex.alexandrov.1988@gmail.com',
		},
		...overrides,
	}
}

describe('InvitationPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockSearchParamGet.mockReturnValue(null)
		mockUseMyInvitations.mockReturnValue({
			data: [createInvitation()],
			isLoading: false,
			isError: false,
		})
		mockAcceptMutateAsync.mockResolvedValue({
			id: 'team-1',
			name: 'Marketing Team',
		})
		mockDeclineMutateAsync.mockResolvedValue({})
	})

	afterEach(cleanup)

	it('не показывает empty state во время перехода после принятия приглашения', async () => {
		let invitations: MyInvitation[] = [createInvitation()]

		mockUseMyInvitations.mockImplementation(() => ({
			data: invitations,
			isLoading: false,
			isError: false,
		}))

		mockAcceptMutateAsync.mockImplementation(async () => {
			invitations = []
			return {
				id: 'team-1',
				name: 'Marketing Team',
			}
		})

		const { rerender } = render(<InvitationPageView hasAuthSession token='token-1' />)

		fireEvent.click(screen.getByRole('button', { name: 'Принять приглашение' }))

		await waitFor(() => {
			expect(mockAcceptMutateAsync).toHaveBeenCalledWith('token-1')
		})

		rerender(<InvitationPageView hasAuthSession token='token-1' />)

		expect(screen.queryByText('Приглашение недоступно')).toBeNull()
		expect(screen.getByText('Marketing Team')).toBeDefined()
		expect(mockReplace).toHaveBeenCalledWith('/teams/team-1/projects')
	})
})
