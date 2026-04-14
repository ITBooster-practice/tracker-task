'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { type MyInvitation } from '@repo/types'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	Skeleton,
	toast,
} from '@repo/ui'
import { Check, Mail, X } from '@repo/ui/icons'

import {
	useAcceptInvitation,
	useDeclineInvitation,
	useMyInvitations,
} from '@/shared/api/use-team-invitations'
import {
	buildLoginHref,
	buildRegisterHref,
	invitationRoutes,
	ROUTE_QUERY_PARAMS,
	ROUTES,
	teamRoutes,
} from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'
import { getUserDisplayName } from '@/shared/lib/user'

import { INVITATION_PAGE_TEXT } from '../config/constants'

type InvitationPageViewProps = {
	hasAuthSession: boolean
	token: string
}

const pageShellClassName =
	'mx-auto flex w-full max-w-[620px] flex-col gap-6 text-foreground'
const pageHeaderClassName = 'space-y-2 text-center'
const cardClassName = 'border-border/80 bg-card/90 shadow-[0_24px_80px_rgba(3,7,18,0.32)]'
const actionsClassName = 'flex flex-col gap-3 sm:flex-row'

function InvitationPageView({ hasAuthSession, token }: InvitationPageViewProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [cachedInvitation, setCachedInvitation] = useState<MyInvitation | null>(null)
	const [hasHandledAutoAccept, setHasHandledAutoAccept] = useState(false)
	const [activeAction, setActiveAction] = useState<'accept' | 'decline' | null>(null)
	const currentInvitationRoute = `${invitationRoutes.token(token)}?${new URLSearchParams({
		[ROUTE_QUERY_PARAMS.autoAccept]: '1',
	}).toString()}`
	const invitationsQuery = useMyInvitations({ enabled: hasAuthSession })
	const acceptInvitationMutation = useAcceptInvitation()
	const declineInvitationMutation = useDeclineInvitation()

	const invitation = invitationsQuery.data?.find((item) => item.token === token) ?? null
	const displayInvitation = invitation ?? cachedInvitation
	const inviterName = displayInvitation
		? getUserDisplayName(displayInvitation.invitedBy)
		: null
	const isAcceptPending = activeAction === 'accept'
	const isDeclinePending = activeAction === 'decline'
	const isActionPending = activeAction !== null
	const shouldAutoAccept =
		searchParams.get(ROUTE_QUERY_PARAMS.autoAccept) === '1' &&
		hasAuthSession &&
		!hasHandledAutoAccept

	const handleAcceptInvitation = async () => {
		try {
			setActiveAction('accept')
			const team = await acceptInvitationMutation.mutateAsync(token)
			toast.success(`${INVITATION_PAGE_TEXT.acceptSuccessPrefix} ${team.name}`)
			router.replace(teamRoutes.projects(team.id))
		} catch (error) {
			setActiveAction(null)
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	const handleDeclineInvitation = async () => {
		try {
			setActiveAction('decline')
			await declineInvitationMutation.mutateAsync(token)
			toast.success(INVITATION_PAGE_TEXT.declineSuccess)
			router.replace(ROUTES.profile)
		} catch (error) {
			setActiveAction(null)
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	useEffect(() => {
		if (invitation) {
			setCachedInvitation(invitation)
		}
	}, [invitation])

	useEffect(() => {
		if (!shouldAutoAccept || invitationsQuery.isLoading || !invitation) {
			return
		}

		setHasHandledAutoAccept(true)
		void handleAcceptInvitation()
	}, [invitation, invitationsQuery.isLoading, shouldAutoAccept])

	if (!hasAuthSession) {
		return (
			<div className={pageShellClassName}>
				<header className={pageHeaderClassName}>
					<h1 className='text-3xl font-semibold tracking-tight'>
						{INVITATION_PAGE_TEXT.title}
					</h1>
					<p className='text-sm text-muted-foreground'>{INVITATION_PAGE_TEXT.subtitle}</p>
				</header>

				<EmptyState
					icon={<Mail className='size-8' />}
					title={INVITATION_PAGE_TEXT.loginTitle}
					description={INVITATION_PAGE_TEXT.loginDescription}
					action={
						<div className={actionsClassName}>
							<Button
								type='button'
								onClick={() => router.push(buildLoginHref(currentInvitationRoute))}
							>
								{INVITATION_PAGE_TEXT.loginAction}
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={() => router.push(buildRegisterHref(currentInvitationRoute))}
							>
								{INVITATION_PAGE_TEXT.registerAction}
							</Button>
						</div>
					}
					className='border-border bg-card'
				/>
			</div>
		)
	}

	if (invitationsQuery.isLoading) {
		return (
			<div className={pageShellClassName}>
				<header className={pageHeaderClassName}>
					<Skeleton className='mx-auto h-10 w-60' />
					<Skeleton className='mx-auto h-4 w-72' />
				</header>
				<Card className={cardClassName}>
					<CardHeader className='space-y-3'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-2/3' />
					</CardHeader>
					<CardContent className='space-y-3'>
						<Skeleton className='h-10 w-full' />
						<Skeleton className='h-10 w-full' />
					</CardContent>
				</Card>
			</div>
		)
	}

	if (invitationsQuery.isError || !displayInvitation) {
		return (
			<div className={pageShellClassName}>
				<EmptyState
					icon={<Mail className='size-8' />}
					title={INVITATION_PAGE_TEXT.missingTitle}
					description={INVITATION_PAGE_TEXT.missingDescription}
					action={
						<div className={actionsClassName}>
							<Button type='button' onClick={() => router.push(ROUTES.profile)}>
								{INVITATION_PAGE_TEXT.profileAction}
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={() => router.push(ROUTES.teams)}
							>
								{INVITATION_PAGE_TEXT.teamsAction}
							</Button>
						</div>
					}
					className='border-border bg-card'
				/>
			</div>
		)
	}

	return (
		<div className={pageShellClassName}>
			<header className={pageHeaderClassName}>
				<h1 className='text-3xl font-semibold tracking-tight'>
					{INVITATION_PAGE_TEXT.title}
				</h1>
				<p className='text-sm text-muted-foreground'>{INVITATION_PAGE_TEXT.subtitle}</p>
			</header>

			<Card className={cardClassName}>
				<CardHeader className='space-y-3'>
					<div className='inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12 text-primary'>
						<Mail className='size-5' />
					</div>
					<CardTitle className='text-2xl font-semibold'>
						{displayInvitation.team.name}
					</CardTitle>
					<div className='space-y-1 text-sm text-muted-foreground'>
						<p>
							{INVITATION_PAGE_TEXT.inviterPrefix} {inviterName}
						</p>
						<p>
							{INVITATION_PAGE_TEXT.rolePrefix}: {displayInvitation.role}
						</p>
					</div>
				</CardHeader>
				<CardContent className='space-y-3'>
					<div className={actionsClassName}>
						<Button
							type='button'
							onClick={() => void handleAcceptInvitation()}
							disabled={isActionPending}
							className='flex-1'
						>
							<Check className='size-4' />
							{isAcceptPending
								? INVITATION_PAGE_TEXT.acceptPendingAction
								: INVITATION_PAGE_TEXT.acceptAction}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={() => void handleDeclineInvitation()}
							disabled={isActionPending}
							className='flex-1'
						>
							<X className='size-4' />
							{isDeclinePending
								? INVITATION_PAGE_TEXT.declinePendingAction
								: INVITATION_PAGE_TEXT.declineAction}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export { InvitationPageView }
