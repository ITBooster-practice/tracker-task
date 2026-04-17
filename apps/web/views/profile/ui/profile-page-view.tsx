'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactNode } from 'react'

import { Button, EmptyState, Skeleton, toast } from '@repo/ui'

import { useMe } from '@/shared/api/use-auth'
import {
	useAcceptInvitation,
	useDeclineInvitation,
	useMyInvitations,
} from '@/shared/api/use-team-invitations'
import { useTeamsList } from '@/shared/api/use-teams'
import { teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'
import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

import { profileCopy } from '../config/constants'
import {
	profilePageContainerClassName,
	profilePageHeaderClassName,
	profilePageShellClassName,
	profilePageSubtitleClassName,
	profilePageTitleClassName,
	profilePrimaryButtonClassName,
	profileSectionGridClassName,
} from '../lib/styles'
import { getPrimaryRole } from '../lib/utils'
import { useProfileForm } from '../model/use-profile-form'
import { ProfileInvitationsSection } from './profile-invitations-section'
import { ProfileSummaryCard } from './profile-summary-card'
import { ProfileTeamsSection } from './profile-teams-section'

type ProfilePageLayoutProps = {
	children: ReactNode
}

const ProfilePageLayout = ({ children }: ProfilePageLayoutProps) => (
	<div className={profilePageShellClassName}>
		<div className={profilePageContainerClassName}>{children}</div>
	</div>
)

const ProfilePageLoadingState = () => (
	<ProfilePageLayout>
		<header className={profilePageHeaderClassName}>
			<div className='space-y-2'>
				<Skeleton className='h-10 w-64' />
				<Skeleton className='h-4 w-72' />
			</div>
		</header>
		<div className={profileSectionGridClassName}>
			<Skeleton className='h-[200px] rounded-[var(--radius-surface)]' />
			<Skeleton className='h-[170px] rounded-[var(--radius-surface)]' />
			<Skeleton className='h-[180px] rounded-[var(--radius-surface)]' />
		</div>
	</ProfilePageLayout>
)

type ProfilePageErrorStateProps = {
	onRetry: () => void
}

const ProfilePageErrorState = ({ onRetry }: ProfilePageErrorStateProps) => (
	<ProfilePageLayout>
		<EmptyState
			title={profileCopy.profileLoadError.title}
			description={profileCopy.profileLoadError.description}
			action={
				<Button
					type='button'
					onClick={() => void onRetry()}
					className={profilePrimaryButtonClassName}
				>
					{profileCopy.retryAction}
				</Button>
			}
			className='mx-auto max-w-[460px] border-border bg-card'
		/>
	</ProfilePageLayout>
)

const ProfilePageView = () => {
	const router = useRouter()
	const profileQuery = useMe()
	const teamsQuery = useTeamsList()
	const invitationsQuery = useMyInvitations()
	const acceptInvitationMutation = useAcceptInvitation()
	const declineInvitationMutation = useDeclineInvitation()

	const teams = teamsQuery.data?.data ?? []
	const invitations = invitationsQuery.data ?? []
	const displayName = getUserDisplayName(profileQuery.data)
	const initials = getNameInitials(displayName)
	const primaryRole = getPrimaryRole(teams)
	const { formName, formEmail, isDirty, setFormName, setFormEmail } = useProfileForm(
		profileQuery.data,
	)

	const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!isDirty) {
			return
		}

		toast.info(profileCopy.saveUnavailable)
	}

	const handleOpenTeam = (teamId: string) => {
		router.push(teamRoutes.projects(teamId))
	}

	const handleAcceptInvitation = async (token: string) => {
		try {
			const team = await acceptInvitationMutation.mutateAsync(token)
			toast.success(`Вы присоединились к команде ${team.name}`)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleDeclineInvitation = async (token: string) => {
		try {
			await declineInvitationMutation.mutateAsync(token)
			toast.success(profileCopy.invitations.declineSuccess)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	if (profileQuery.isLoading) {
		return <ProfilePageLoadingState />
	}

	if (profileQuery.isError || !profileQuery.data) {
		return <ProfilePageErrorState onRetry={() => void profileQuery.refetch()} />
	}

	return (
		<ProfilePageLayout>
			<header className={profilePageHeaderClassName}>
				<div>
					<h1 className={profilePageTitleClassName}>{profileCopy.title}</h1>
					<p className={profilePageSubtitleClassName}>{profileCopy.subtitle}</p>
				</div>
			</header>

			<div className={profileSectionGridClassName}>
				<ProfileSummaryCard
					displayName={displayName}
					email={profileQuery.data.email}
					formName={formName}
					formEmail={formEmail}
					initials={initials}
					isDirty={isDirty}
					primaryRole={primaryRole}
					onFormSubmit={handleSaveProfile}
					onNameChange={setFormName}
					onEmailChange={setFormEmail}
				/>

				<ProfileTeamsSection
					teams={teams}
					isLoading={teamsQuery.isLoading}
					isError={teamsQuery.isError}
					onRetry={() => void teamsQuery.refetch()}
					onOpenTeam={handleOpenTeam}
				/>

				<ProfileInvitationsSection
					invitations={invitations}
					isLoading={invitationsQuery.isLoading}
					isError={invitationsQuery.isError}
					onRetry={() => void invitationsQuery.refetch()}
					onAccept={(token) => void handleAcceptInvitation(token)}
					onDecline={(token) => void handleDeclineInvitation(token)}
					acceptState={{
						isPending: acceptInvitationMutation.isPending,
						token: acceptInvitationMutation.variables,
					}}
					declineState={{
						isPending: declineInvitationMutation.isPending,
						token: declineInvitationMutation.variables,
					}}
				/>
			</div>
		</ProfilePageLayout>
	)
}

export { ProfilePageView }
