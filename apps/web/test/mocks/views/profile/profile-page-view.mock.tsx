import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type ProfilePageViewMockState = {
	mockProfileAcceptMutateAsync: TestMock
	mockProfileDeclineMutateAsync: TestMock
	mockProfileToastError: TestMock
	mockProfileToastInfo: TestMock
	mockProfileToastSuccess: TestMock
	mockProfileUseMe: TestMock
	mockProfileUseMyInvitations: TestMock
	mockProfileUseTeamsList: TestMock
	mockProfileRouterPush: TestMock
}

const profilePageViewMockState = vi.hoisted(
	(): ProfilePageViewMockState => ({
		mockProfileAcceptMutateAsync: vi.fn(),
		mockProfileDeclineMutateAsync: vi.fn(),
		mockProfileToastError: vi.fn(),
		mockProfileToastInfo: vi.fn(),
		mockProfileToastSuccess: vi.fn(),
		mockProfileUseMe: vi.fn(),
		mockProfileUseMyInvitations: vi.fn(),
		mockProfileUseTeamsList: vi.fn(),
		mockProfileRouterPush: vi.fn(),
	}),
)

export const mockProfileAcceptMutateAsync: TestMock =
	profilePageViewMockState.mockProfileAcceptMutateAsync
export const mockProfileDeclineMutateAsync: TestMock =
	profilePageViewMockState.mockProfileDeclineMutateAsync
export const mockProfileToastError: TestMock =
	profilePageViewMockState.mockProfileToastError
export const mockProfileToastInfo: TestMock =
	profilePageViewMockState.mockProfileToastInfo
export const mockProfileToastSuccess: TestMock =
	profilePageViewMockState.mockProfileToastSuccess
export const mockProfileUseMe: TestMock = profilePageViewMockState.mockProfileUseMe
export const mockProfileUseMyInvitations: TestMock =
	profilePageViewMockState.mockProfileUseMyInvitations
export const mockProfileUseTeamsList: TestMock =
	profilePageViewMockState.mockProfileUseTeamsList
export const mockProfileRouterPush: TestMock =
	profilePageViewMockState.mockProfileRouterPush

export function resetProfilePageViewMocks() {
	vi.clearAllMocks()
}

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockProfileRouterPush }),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => mockProfileUseMe(),
}))

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockProfileUseTeamsList(),
}))

vi.mock('@/shared/api/use-team-invitations', () => ({
	useMyInvitations: () => mockProfileUseMyInvitations(),
	useAcceptInvitation: () => ({
		mutateAsync: mockProfileAcceptMutateAsync,
		isPending: false,
		variables: undefined,
	}),
	useDeclineInvitation: () => ({
		mutateAsync: mockProfileDeclineMutateAsync,
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
		action,
		title,
	}: {
		action?: React.ReactNode
		className?: string
		description?: string
		title: string
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
		error: mockProfileToastError,
		info: mockProfileToastInfo,
		success: mockProfileToastSuccess,
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
