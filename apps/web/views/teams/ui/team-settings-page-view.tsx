'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'

import { TEAM_ROLES, userEmailSchema, type TeamMember } from '@repo/types'
import { Button, ConfirmDialog, EmptyState, toast } from '@repo/ui'
import { UserPlus, Users } from '@repo/ui/icons'

import { useMe } from '@/shared/api/use-auth'
import {
	useRevokeTeamInvitation,
	useSendTeamInvitation,
	useTeamInvitations,
} from '@/shared/api/use-team-invitations'
import {
	useChangeMemberRole,
	useRemoveTeamMember,
	useTeamMembers,
} from '@/shared/api/use-team-members'
import { useDeleteTeam, useTeamDetail } from '@/shared/api/use-teams'
import { ROUTES } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import {
	TEAM_SETTINGS_TEXT,
	type TeamAssignableRole,
} from '../config/team-settings.constants'
import {
	teamPageHeaderClassName,
	teamPagePrimaryButtonClassName,
	teamPageSubtitleClassName,
	teamPageTitleClassName,
} from '../lib/styles'
import {
	canDeleteTeam,
	getCurrentTeamMember,
	getDeleteMemberDescription,
	getDeleteMemberDialogCopy,
	isTeamManagerRole,
} from '../lib/team-settings'
import { TeamInviteMemberDialog } from './team-invite-member-dialog'
import { TeamSettingsDangerZoneSection } from './team-settings-danger-zone-section'
import { TeamSettingsInvitationsSection } from './team-settings-invitations-section'
import { TeamSettingsMembersSection } from './team-settings-members-section'
import { TeamSettingsRolesSection } from './team-settings-roles-section'

const INITIAL_INVITE_ROLE = TEAM_ROLES.MEMBER

function TeamSettingsPageView() {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const teamId = params.id

	const [inviteEmail, setInviteEmail] = useState('')
	const [inviteOpen, setInviteOpen] = useState(false)
	const [inviteRole, setInviteRole] = useState<TeamAssignableRole>(INITIAL_INVITE_ROLE)
	const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
	const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false)

	const profileQuery = useMe()
	const teamQuery = useTeamDetail(teamId)
	const membersQuery = useTeamMembers(teamId)

	const members = useMemo(
		() => membersQuery.data ?? teamQuery.data?.members ?? [],
		[membersQuery.data, teamQuery.data?.members],
	)

	const currentUser = profileQuery.data
	const currentUserId = currentUser?.id
	const currentTeamMember = getCurrentTeamMember(members, currentUserId)
	const currentUserRole = currentTeamMember?.role
	const canManageTeam = isTeamManagerRole(currentUserRole)
	const canDeleteCurrentTeam = canDeleteTeam(currentUserRole)

	const invitationsQuery = useTeamInvitations(teamId, {
		enabled: canManageTeam,
	})
	const changeMemberRoleMutation = useChangeMemberRole(teamId)
	const removeTeamMemberMutation = useRemoveTeamMember(teamId)
	const sendTeamInvitationMutation = useSendTeamInvitation(teamId)
	const revokeTeamInvitationMutation = useRevokeTeamInvitation(teamId)
	const deleteTeamMutation = useDeleteTeam()

	const inviteEmailValue = inviteEmail.trim()
	const isInviteEmailValid = userEmailSchema.safeParse(inviteEmailValue).success
	const isDuplicateMember = members.some((member) => member.email === inviteEmailValue)
	const isInviteSubmitDisabled =
		!inviteEmailValue || !isInviteEmailValid || isDuplicateMember

	const isRoleMutationPending = changeMemberRoleMutation.isPending
		? (changeMemberRoleMutation.variables?.userId ?? null)
		: null
	const revokePendingInvitationId = revokeTeamInvitationMutation.isPending
		? (revokeTeamInvitationMutation.variables ?? null)
		: null

	const isSelfRemoveAction = memberToDelete?.userId === currentUserId
	const deleteMemberDialogCopy = memberToDelete
		? getDeleteMemberDialogCopy(isSelfRemoveAction)
		: null

	const resetInviteDialog = () => {
		setInviteEmail('')
		setInviteRole(INITIAL_INVITE_ROLE)
		setInviteOpen(false)
	}

	const handleRoleChange = async (member: TeamMember, nextRole: TeamAssignableRole) => {
		try {
			await changeMemberRoleMutation.mutateAsync({
				userId: member.userId,
				data: { role: nextRole },
			})
			toast.success(TEAM_SETTINGS_TEXT.members.roleUpdated)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleConfirmDeleteMember = async () => {
		if (!memberToDelete) {
			return
		}

		try {
			await removeTeamMemberMutation.mutateAsync(memberToDelete.userId)
			toast.success(
				isSelfRemoveAction
					? TEAM_SETTINGS_TEXT.members.selfLeaveSuccess
					: TEAM_SETTINGS_TEXT.members.removeSuccess,
			)
			setMemberToDelete(null)

			if (isSelfRemoveAction) {
				router.replace(ROUTES.teams)
			}
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isInviteSubmitDisabled) {
			return
		}

		try {
			await sendTeamInvitationMutation.mutateAsync({
				email: inviteEmailValue,
				role: inviteRole,
			})
			toast.success(TEAM_SETTINGS_TEXT.invitations.sendSuccess)
			resetInviteDialog()
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleRevokeInvitation = async (invitationId: string) => {
		try {
			await revokeTeamInvitationMutation.mutateAsync(invitationId)
			toast.success(TEAM_SETTINGS_TEXT.invitations.revokeSuccess)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleDeleteTeam = async () => {
		if (!teamQuery.data) {
			return
		}

		try {
			await deleteTeamMutation.mutateAsync(teamQuery.data.id)
			toast.success(TEAM_SETTINGS_TEXT.dangerZone.success)
			setIsDeleteTeamDialogOpen(false)
			router.replace(ROUTES.teams)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	if (teamQuery.isPending && !teamQuery.data) {
		return (
			<div className='min-h-full w-full bg-background text-foreground'>
				<div className='mx-auto max-w-[960px] px-6 py-5'>
					<div className='flex justify-center py-16 text-sm text-muted-foreground'>
						{TEAM_SETTINGS_TEXT.members.loading}
					</div>
				</div>
			</div>
		)
	}

	if (teamQuery.isError || !teamQuery.data) {
		return (
			<div className='min-h-full w-full bg-background text-foreground'>
				<div className='mx-auto max-w-[960px] px-6 py-5'>
					<div className='flex justify-center py-16'>
						<EmptyState
							icon={<Users className='size-7' />}
							title={TEAM_SETTINGS_TEXT.emptyState.title}
							description={TEAM_SETTINGS_TEXT.emptyState.description}
							action={
								<Button type='button' onClick={() => void teamQuery.refetch()}>
									{TEAM_SETTINGS_TEXT.retryAction}
								</Button>
							}
							className='max-w-[420px] border-border bg-card'
						/>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={teamPageHeaderClassName}>
					<div>
						<h1 className={teamPageTitleClassName}>{TEAM_SETTINGS_TEXT.pageTitle}</h1>
						<p className={teamPageSubtitleClassName}>{teamQuery.data.name}</p>
					</div>

					{canManageTeam ? (
						<Button
							type='button'
							onClick={() => setInviteOpen(true)}
							className={teamPagePrimaryButtonClassName}
						>
							<UserPlus className='size-4' />
							{TEAM_SETTINGS_TEXT.members.inviteAction}
						</Button>
					) : null}
				</header>

				<div className='space-y-5'>
					<TeamSettingsRolesSection />

					<TeamSettingsMembersSection
						currentUserId={currentUserId}
						currentUserRole={currentUserRole}
						isError={membersQuery.isError}
						isLoading={membersQuery.isLoading && members.length === 0}
						isMutatingRoleForUserId={isRoleMutationPending}
						members={members}
						onOpenRemoveDialog={setMemberToDelete}
						onRetry={() => void membersQuery.refetch()}
						onRoleChange={handleRoleChange}
					/>

					{canManageTeam ? (
						<TeamSettingsInvitationsSection
							invitations={invitationsQuery.data ?? []}
							isError={invitationsQuery.isError}
							isLoading={invitationsQuery.isLoading}
							onRetry={() => void invitationsQuery.refetch()}
							onRevoke={(invitation) => void handleRevokeInvitation(invitation.id)}
							pendingInvitationId={revokePendingInvitationId}
						/>
					) : null}

					{canDeleteCurrentTeam ? (
						<TeamSettingsDangerZoneSection
							isPending={deleteTeamMutation.isPending}
							onDeleteTeam={() => setIsDeleteTeamDialogOpen(true)}
						/>
					) : null}
				</div>
			</div>

			<TeamInviteMemberDialog
				email={inviteEmail}
				isOpen={inviteOpen}
				isPending={sendTeamInvitationMutation.isPending}
				isSubmitDisabled={isInviteSubmitDisabled}
				onClose={resetInviteDialog}
				onEmailChange={setInviteEmail}
				onOpenChange={(open) => {
					if (!open) {
						resetInviteDialog()
						return
					}

					setInviteOpen(true)
				}}
				onRoleChange={setInviteRole}
				onSubmit={(event) => void handleInviteSubmit(event)}
				role={inviteRole}
			/>

			<ConfirmDialog
				open={Boolean(memberToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setMemberToDelete(null)
					}
				}}
				title={deleteMemberDialogCopy?.title ?? ''}
				description={
					memberToDelete
						? getDeleteMemberDescription(memberToDelete, isSelfRemoveAction)
						: ''
				}
				confirmLabel={deleteMemberDialogCopy?.confirm}
				pendingLabel={deleteMemberDialogCopy?.pending}
				isPending={removeTeamMemberMutation.isPending}
				onConfirm={() => void handleConfirmDeleteMember()}
			/>

			<ConfirmDialog
				open={isDeleteTeamDialogOpen}
				onOpenChange={setIsDeleteTeamDialogOpen}
				title={TEAM_SETTINGS_TEXT.dangerZone.dialogTitle}
				description={TEAM_SETTINGS_TEXT.dangerZone.dialogDescription}
				confirmLabel={TEAM_SETTINGS_TEXT.dangerZone.dialogConfirm}
				pendingLabel={TEAM_SETTINGS_TEXT.dangerZone.dialogPending}
				isPending={deleteTeamMutation.isPending}
				onConfirm={() => void handleDeleteTeam()}
			/>
		</div>
	)
}

export { TeamSettingsPageView }
