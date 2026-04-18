import {
	createTeamFixture,
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import type { TestMock } from '@/test/mocks/mock.types'
import { vi } from 'vitest'

import { TEAM_ROLES, type TeamInvitation, type TeamMember, type User } from '@repo/types'

type TeamSettingsPageMockState = {
	mockChangeRoleMutateAsync: TestMock
	mockDeleteTeamMutateAsync: TestMock
	mockInvitationsRefetch: TestMock
	mockMembersRefetch: TestMock
	mockRemoveMemberMutateAsync: TestMock
	mockRevokeInvitationMutateAsync: TestMock
	mockRouterReplace: TestMock
	mockSendInvitationMutateAsync: TestMock
	mockTeamDetailRefetch: TestMock
	mockToastError: TestMock
	mockToastSuccess: TestMock
	mockUseMe: TestMock
	mockUseTeamDetail: TestMock
	mockUseTeamInvitations: TestMock
	mockUseTeamMembers: TestMock
}

const teamSettingsPageMockState = vi.hoisted(
	(): TeamSettingsPageMockState => ({
		mockChangeRoleMutateAsync: vi.fn(),
		mockDeleteTeamMutateAsync: vi.fn(),
		mockInvitationsRefetch: vi.fn(),
		mockMembersRefetch: vi.fn(),
		mockRemoveMemberMutateAsync: vi.fn(),
		mockRevokeInvitationMutateAsync: vi.fn(),
		mockRouterReplace: vi.fn(),
		mockSendInvitationMutateAsync: vi.fn(),
		mockTeamDetailRefetch: vi.fn(),
		mockToastError: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockUseMe: vi.fn(),
		mockUseTeamDetail: vi.fn(),
		mockUseTeamInvitations: vi.fn(),
		mockUseTeamMembers: vi.fn(),
	}),
)

export const mockChangeRoleMutateAsync: TestMock =
	teamSettingsPageMockState.mockChangeRoleMutateAsync
export const mockDeleteTeamMutateAsync: TestMock =
	teamSettingsPageMockState.mockDeleteTeamMutateAsync
export const mockInvitationsRefetch: TestMock =
	teamSettingsPageMockState.mockInvitationsRefetch
export const mockMembersRefetch: TestMock = teamSettingsPageMockState.mockMembersRefetch
export const mockRemoveMemberMutateAsync: TestMock =
	teamSettingsPageMockState.mockRemoveMemberMutateAsync
export const mockRevokeInvitationMutateAsync: TestMock =
	teamSettingsPageMockState.mockRevokeInvitationMutateAsync
export const mockRouterReplace: TestMock = teamSettingsPageMockState.mockRouterReplace
export const mockSendInvitationMutateAsync: TestMock =
	teamSettingsPageMockState.mockSendInvitationMutateAsync
export const mockTeamDetailRefetch: TestMock =
	teamSettingsPageMockState.mockTeamDetailRefetch
export const mockToastError: TestMock = teamSettingsPageMockState.mockToastError
export const mockToastSuccess: TestMock = teamSettingsPageMockState.mockToastSuccess
export const mockUseMe: TestMock = teamSettingsPageMockState.mockUseMe
export const mockUseTeamDetail: TestMock = teamSettingsPageMockState.mockUseTeamDetail
export const mockUseTeamInvitations: TestMock =
	teamSettingsPageMockState.mockUseTeamInvitations
export const mockUseTeamMembers: TestMock = teamSettingsPageMockState.mockUseTeamMembers

export const currentTeamSettingsUser: User = {
	id: 'user-1',
	name: 'Alex',
	email: 'alex.alexandrov.1988@gmail.com',
}

export function createTeamSettingsMembers(): TeamMember[] {
	return [
		createTeamMemberFixture({
			id: 'member-owner',
			userId: 'user-1',
			email: 'alex.alexandrov.1988@gmail.com',
			role: TEAM_ROLES.OWNER,
		}),
		createTeamMemberFixture({
			id: 'member-2',
			userId: 'user-2',
			email: 'MadMan1988@yandex.ru',
			role: TEAM_ROLES.MEMBER,
		}),
	]
}

type SetupTeamSettingsPageOptions = {
	invitations?: TeamInvitation[]
	members?: TeamMember[]
	teamError?: boolean
	teamPending?: boolean
}

export function resetTeamSettingsPageMocks() {
	vi.clearAllMocks()
}

export function setupTeamSettingsPage({
	invitations = [createTeamInvitationFixture()],
	members = createTeamSettingsMembers(),
	teamError = false,
	teamPending = false,
}: SetupTeamSettingsPageOptions = {}) {
	mockUseMe.mockReturnValue({
		data: currentTeamSettingsUser,
	})
	mockUseTeamDetail.mockReturnValue({
		data:
			teamPending || teamError ? undefined : createTeamFixture({ id: 'team-1', members }),
		isPending: teamPending,
		isError: teamError,
		refetch: mockTeamDetailRefetch,
	})
	mockUseTeamMembers.mockReturnValue({
		data:
			teamPending || teamError
				? undefined
				: {
						data: members,
						meta: { page: 1, limit: 10, total: members.length, totalPages: 1 },
					},
		isLoading: false,
		isError: false,
		refetch: mockMembersRefetch,
	})
	mockUseTeamInvitations.mockReturnValue({
		data: {
			data: invitations,
			meta: { page: 1, limit: 10, total: invitations.length, totalPages: 1 },
		},
		isLoading: false,
		isError: false,
		refetch: mockInvitationsRefetch,
	})
}

vi.mock('next/navigation', () => ({
	useParams: () => ({ id: 'team-1' }),
	useRouter: () => ({ replace: mockRouterReplace }),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => mockUseMe(),
}))

vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => mockUseTeamDetail(),
	useDeleteTeam: () => ({
		mutateAsync: mockDeleteTeamMutateAsync,
		isPending: false,
	}),
}))

vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMembers: () => mockUseTeamMembers(),
	useChangeMemberRole: () => ({
		mutateAsync: mockChangeRoleMutateAsync,
		isPending: false,
		variables: undefined,
	}),
	useRemoveTeamMember: () => ({
		mutateAsync: mockRemoveMemberMutateAsync,
		isPending: false,
		variables: undefined,
	}),
}))

vi.mock('@/shared/api/use-team-invitations', () => ({
	useTeamInvitations: () => mockUseTeamInvitations(),
	useSendTeamInvitation: () => ({
		mutateAsync: mockSendInvitationMutateAsync,
		isPending: false,
		variables: undefined,
	}),
	useRevokeTeamInvitation: () => ({
		mutateAsync: mockRevokeInvitationMutateAsync,
		isPending: false,
		variables: undefined,
	}),
}))

vi.mock('@repo/ui', () => ({
	usePagination: () => ({
		page: 1,
		limit: 10,
		setPage: vi.fn(),
		paginationParams: { page: 1, limit: 10 },
	}),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	ConfirmDialog: ({
		confirmLabel,
		description,
		onConfirm,
		onOpenChange,
		open,
		title,
	}: {
		confirmLabel?: string
		description?: React.ReactNode
		onConfirm: () => void
		onOpenChange: (open: boolean) => void
		open: boolean
		title: React.ReactNode
	}) =>
		open ? (
			<div data-testid='confirm-dialog'>
				<div>{title}</div>
				<div>{description}</div>
				<button onClick={() => void onConfirm()}>{confirmLabel ?? 'Подтвердить'}</button>
				<button onClick={() => onOpenChange(false)}>Закрыть</button>
			</div>
		) : null,
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
	toast: {
		error: mockToastError,
		success: mockToastSuccess,
	},
}))

vi.mock('@repo/ui/icons', () => ({
	Crown: () => <span />,
	Mail: () => <span />,
	Settings2: () => <span />,
	Shield: () => <span />,
	Trash2: () => <span />,
	UserPlus: () => <span />,
	Users: () => <span />,
}))

vi.mock('@/views/teams/ui/team-settings-roles-section', () => ({
	TeamSettingsRolesSection: () => <div>roles-section</div>,
}))

vi.mock('@/views/teams/ui/team-settings-members-section', () => ({
	TeamSettingsMembersSection: ({
		isError,
		isLoading,
		members,
		onRetry,
		onOpenRemoveDialog,
		onRoleChange,
	}: {
		isError: boolean
		isLoading: boolean
		members: TeamMember[]
		onRetry: () => void
		onOpenRemoveDialog: (member: TeamMember) => void
		onRoleChange: (member: TeamMember, nextRole: 'ADMIN' | 'MEMBER') => void
	}) => {
		if (isLoading) {
			return <div>Загрузка участников...</div>
		}

		if (isError) {
			return <button onClick={onRetry}>Повторить участников</button>
		}

		return (
			<div>
				{members.map((member) => (
					<div key={member.id}>
						<span>{member.email}</span>
						<button onClick={() => onRoleChange(member, TEAM_ROLES.ADMIN)}>
							Сделать админом {member.email}
						</button>
						<button onClick={() => onOpenRemoveDialog(member)}>
							Удалить {member.email}
						</button>
					</div>
				))}
			</div>
		)
	},
}))

vi.mock('@/views/teams/ui/team-settings-invitations-section', () => ({
	TeamSettingsInvitationsSection: ({
		invitations,
		onRevoke,
	}: {
		invitations: TeamInvitation[]
		onRevoke: (invitation: TeamInvitation) => void
	}) => (
		<div>
			{invitations.map((invitation) => (
				<button key={invitation.id} onClick={() => onRevoke(invitation)}>
					Отозвать {invitation.email}
				</button>
			))}
		</div>
	),
}))

vi.mock('@/views/teams/ui/team-settings-danger-zone-section', () => ({
	TeamSettingsDangerZoneSection: ({
		onDeleteTeam,
	}: {
		isPending: boolean
		onDeleteTeam: () => void
	}) => <button onClick={onDeleteTeam}>Удалить команду</button>,
}))

vi.mock('@/views/teams/ui/team-invite-member-dialog', () => ({
	TeamInviteMemberDialog: ({
		email,
		isOpen,
		onClose,
		onEmailChange,
		onOpenChange,
		onSubmit,
	}: {
		email: string
		isOpen: boolean
		isPending: boolean
		isSubmitDisabled: boolean
		onClose: () => void
		onEmailChange: (value: string) => void
		onOpenChange: (open: boolean) => void
		onRoleChange: (role: 'ADMIN' | 'MEMBER') => void
		onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
		role: 'ADMIN' | 'MEMBER'
	}) =>
		isOpen ? (
			<form onSubmit={onSubmit}>
				<input
					placeholder='invite-email'
					value={email}
					onChange={(event) => onEmailChange(event.target.value)}
				/>
				<button type='submit'>Отправить приглашение</button>
				<button type='button' onClick={() => onOpenChange(false)}>
					Скрыть
				</button>
				<button type='button' onClick={() => onOpenChange(true)}>
					Открыть снова
				</button>
				<button type='button' onClick={onClose}>
					Закрыть
				</button>
			</form>
		) : null,
}))
