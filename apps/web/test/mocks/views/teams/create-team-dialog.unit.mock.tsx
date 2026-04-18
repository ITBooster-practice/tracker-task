import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

type CreateTeamDialogUnitMockState = {
	mockCreateTeamMutateAsync: TestMock
	mockIsApiError: TestMock
	mockRouterReplace: TestMock
	mockTeamCreatePendingState: { value: boolean }
	mockToastError: TestMock
}

const createTeamDialogUnitMockState = vi.hoisted(
	(): CreateTeamDialogUnitMockState => ({
		mockCreateTeamMutateAsync: vi.fn(),
		mockIsApiError: vi.fn(),
		mockRouterReplace: vi.fn(),
		mockTeamCreatePendingState: { value: false },
		mockToastError: vi.fn(),
	}),
)

export const mockCreateTeamMutateAsync: TestMock =
	createTeamDialogUnitMockState.mockCreateTeamMutateAsync
export const mockIsApiError: TestMock = createTeamDialogUnitMockState.mockIsApiError
export const mockRouterReplace: TestMock = createTeamDialogUnitMockState.mockRouterReplace
export const mockTeamCreatePendingState =
	createTeamDialogUnitMockState.mockTeamCreatePendingState
export const mockToastError: TestMock = createTeamDialogUnitMockState.mockToastError

export function resetCreateTeamDialogUnitMocks() {
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

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: mockIsApiError,
	toApiError: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	DialogDrawer: ({
		children,
		onOpenChange,
	}: React.PropsWithChildren<{
		open: boolean
		onOpenChange: (value: boolean) => void
	}>) => (
		<div data-testid='dialog'>
			<button
				type='button'
				data-testid='drawer-close'
				onClick={() => onOpenChange(false)}
			>
				close-drawer
			</button>
			{children}
		</div>
	),
	DialogDrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	DialogDrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DialogDrawerFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: ({
		children,
		...props
	}: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
		<label {...props}>{children}</label>
	),
	toast: { error: mockToastError },
}))
