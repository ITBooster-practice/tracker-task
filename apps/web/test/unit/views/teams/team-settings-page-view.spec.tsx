import {
	createTeamFixture,
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES, type TeamInvitation, type TeamMember, type User } from '@repo/types'

import { TeamSettingsPageView } from '@/views/teams/ui/team-settings-page-view'

const {
	mockRouterReplace,
	mockToastError,
	mockToastSuccess,
	mockUseMe,
	mockUseTeamDetail,
	mockUseTeamMembers,
	mockUseTeamInvitations,
	mockChangeRoleMutateAsync,
	mockRemoveMemberMutateAsync,
	mockSendInvitationMutateAsync,
	mockRevokeInvitationMutateAsync,
	mockDeleteTeamMutateAsync,
} = vi.hoisted(() => ({
	mockRouterReplace: vi.fn(),
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	mockUseMe: vi.fn(),
	mockUseTeamDetail: vi.fn(),
	mockUseTeamMembers: vi.fn(),
	mockUseTeamInvitations: vi.fn(),
	mockChangeRoleMutateAsync: vi.fn(),
	mockRemoveMemberMutateAsync: vi.fn(),
	mockSendInvitationMutateAsync: vi.fn(),
	mockRevokeInvitationMutateAsync: vi.fn(),
	mockDeleteTeamMutateAsync: vi.fn(),
}))

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
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	ConfirmDialog: ({
		open,
		title,
		description,
		confirmLabel,
		onConfirm,
		onOpenChange,
	}: {
		open: boolean
		title: React.ReactNode
		description?: React.ReactNode
		confirmLabel?: string
		onConfirm: () => void
		onOpenChange: (open: boolean) => void
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
		onOpenRemoveDialog,
	}: {
		isError: boolean
		isLoading: boolean
		members: TeamMember[]
		onOpenRemoveDialog: (member: TeamMember) => void
	}) => {
		if (isLoading) {
			return <div>Загрузка участников...</div>
		}

		if (isError) {
			return <div>member-error</div>
		}

		return (
			<div>
				{members.map((member) => (
					<div key={member.id}>
						<span>{member.email}</span>
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
				<button type='button' onClick={onClose}>
					Закрыть
				</button>
			</form>
		) : null,
}))

const currentUser: User = {
	id: 'user-1',
	name: 'Alex',
	email: 'alex.alexandrov.1988@gmail.com',
}

const createTeamMembers = () => [
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

function setupTeamPage({
	members = createTeamMembers(),
	invitations = [createTeamInvitationFixture()],
	teamError = false,
	teamPending = false,
}: {
	members?: TeamMember[]
	invitations?: TeamInvitation[]
	teamError?: boolean
	teamPending?: boolean
} = {}) {
	mockUseMe.mockReturnValue({
		data: currentUser,
	})
	mockUseTeamDetail.mockReturnValue({
		data:
			teamPending || teamError ? undefined : createTeamFixture({ id: 'team-1', members }),
		isPending: teamPending,
		isError: teamError,
		refetch: vi.fn(),
	})
	mockUseTeamMembers.mockReturnValue({
		data: teamPending || teamError ? undefined : members,
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	})
	mockUseTeamInvitations.mockReturnValue({
		data: invitations,
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	})
}

describe('TeamSettingsPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		setupTeamPage()
	})

	afterEach(cleanup)

	it('loading — показывает "Загрузка участников..."', () => {
		setupTeamPage({ teamPending: true })

		render(<TeamSettingsPageView />)

		expect(screen.getByText('Загрузка участников...')).toBeDefined()
	})

	it('error — показывает empty state "Не удалось загрузить команду"', () => {
		setupTeamPage({ teamError: true })

		render(<TeamSettingsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Не удалось загрузить команду')).toBeDefined()
	})

	it('владелец видит кнопку приглашения и danger zone', () => {
		render(<TeamSettingsPageView />)

		expect(screen.getByRole('button', { name: 'Пригласить' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Удалить команду' })).toBeDefined()
	})

	it('отправляет приглашение без изменения регистра email', async () => {
		mockSendInvitationMutateAsync.mockResolvedValue(createTeamInvitationFixture())
		setupTeamPage({
			members: [
				createTeamMemberFixture({
					id: 'member-owner',
					userId: 'user-1',
					email: 'alex.alexandrov.1988@gmail.com',
					role: TEAM_ROLES.OWNER,
				}),
			],
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }))
		fireEvent.change(screen.getByPlaceholderText('invite-email'), {
			target: { value: 'MadMan1988@yandex.ru' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Отправить приглашение' }))

		await waitFor(() => {
			expect(mockSendInvitationMutateAsync).toHaveBeenCalledWith({
				email: 'MadMan1988@yandex.ru',
				role: TEAM_ROLES.MEMBER,
			})
		})
	})

	it('удаляет участника по userId после подтверждения', async () => {
		mockRemoveMemberMutateAsync.mockResolvedValue({
			message: 'ok',
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить MadMan1988@yandex.ru' }))
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

		await waitFor(() => {
			expect(mockRemoveMemberMutateAsync).toHaveBeenCalledWith('user-2')
		})
	})

	it('удаляет команду после подтверждения', async () => {
		mockDeleteTeamMutateAsync.mockResolvedValue({
			message: 'Команда удалена',
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить команду' }))
		fireEvent.click(screen.getAllByRole('button', { name: 'Удалить команду' })[1]!)

		await waitFor(() => {
			expect(mockDeleteTeamMutateAsync).toHaveBeenCalledWith('team-1')
			expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
		})
	})
})
