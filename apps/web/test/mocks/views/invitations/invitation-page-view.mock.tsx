import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type InvitationPageViewMockState = {
	mockAcceptMutateAsync: TestMock
	mockDeclineMutateAsync: TestMock
	mockInvitationSearchParamGet: TestMock
	mockInvitationToastError: TestMock
	mockInvitationToastSuccess: TestMock
	mockInvitationUseMyInvitations: TestMock
	mockInvitationRouterPush: TestMock
	mockInvitationRouterReplace: TestMock
}

const invitationPageViewMockState = vi.hoisted(
	(): InvitationPageViewMockState => ({
		mockAcceptMutateAsync: vi.fn(),
		mockDeclineMutateAsync: vi.fn(),
		mockInvitationSearchParamGet: vi.fn(),
		mockInvitationToastError: vi.fn(),
		mockInvitationToastSuccess: vi.fn(),
		mockInvitationUseMyInvitations: vi.fn(),
		mockInvitationRouterPush: vi.fn(),
		mockInvitationRouterReplace: vi.fn(),
	}),
)

export const mockAcceptMutateAsync: TestMock =
	invitationPageViewMockState.mockAcceptMutateAsync
export const mockDeclineMutateAsync: TestMock =
	invitationPageViewMockState.mockDeclineMutateAsync
export const mockInvitationSearchParamGet: TestMock =
	invitationPageViewMockState.mockInvitationSearchParamGet
export const mockInvitationToastError: TestMock =
	invitationPageViewMockState.mockInvitationToastError
export const mockInvitationToastSuccess: TestMock =
	invitationPageViewMockState.mockInvitationToastSuccess
export const mockInvitationUseMyInvitations: TestMock =
	invitationPageViewMockState.mockInvitationUseMyInvitations
export const mockInvitationRouterPush: TestMock =
	invitationPageViewMockState.mockInvitationRouterPush
export const mockInvitationRouterReplace: TestMock =
	invitationPageViewMockState.mockInvitationRouterReplace

export function resetInvitationPageViewMocks() {
	vi.clearAllMocks()
	mockInvitationSearchParamGet.mockReturnValue(null)
}

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockInvitationRouterPush,
		replace: mockInvitationRouterReplace,
	}),
	useSearchParams: () => ({
		get: mockInvitationSearchParamGet,
	}),
}))

vi.mock('@/shared/api/use-team-invitations', () => ({
	useMyInvitations: (options?: { enabled?: boolean }) =>
		mockInvitationUseMyInvitations(options),
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
		action,
		description,
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
			{description ? <p>{description}</p> : null}
			{action}
		</div>
	),
	Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='skeleton' {...props} />
	),
	toast: {
		error: mockInvitationToastError,
		success: mockInvitationToastSuccess,
	},
}))

vi.mock('@repo/ui/icons', () => ({
	Check: () => <span />,
	Mail: () => <span />,
	X: () => <span />,
}))
