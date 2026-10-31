'use client'

import Link from 'next/link'

import type { TeamRole } from '@repo/types'
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	UserSummary,
	type BadgeTone,
} from '@repo/ui'

import { LogoutButton } from '@/features/auth'
import { useMe } from '@/shared/api/use-auth'
import { useProjectDetail } from '@/shared/api/use-projects'
import { useTeamDetail } from '@/shared/api/use-teams'
import { ROUTES } from '@/shared/config'
import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

interface SidebarUserProps {
	teamId: string | null
	projectId: string | null
	isOpen: boolean
	onNavigate?: () => void
}

const ROLE_LABELS: Record<TeamRole, string> = {
	OWNER: 'Владелец',
	ADMIN: 'Администратор',
	MEMBER: 'Участник',
}

const ROLE_TONES: Record<TeamRole, BadgeTone> = {
	OWNER: 'owner',
	ADMIN: 'admin',
	MEMBER: 'member',
}

function SidebarUser({ teamId, projectId, isOpen, onNavigate }: SidebarUserProps) {
	const profileQuery = useMe()
	const options = {
		accountId: profileQuery.data?.id ?? '',
		enabled: Boolean(profileQuery.data?.id),
	}
	const teamQuery = useTeamDetail(teamId ?? '', options)
	const projectQuery = useProjectDetail(teamId ?? '', projectId ?? '', options)
	const pending = Boolean(
		profileQuery.isPending ||
		(teamId && (teamQuery.isPending || teamQuery.isFetching)) ||
		(projectId && (projectQuery.isPending || projectQuery.isFetching)),
	)
	const team = teamQuery.data?.id === teamId ? teamQuery.data : null
	const project =
		projectQuery.data?.id === projectId && projectQuery.data?.teamId === teamId
			? projectQuery.data
			: null
	const hasContext = Boolean(
		!pending &&
		!profileQuery.isError &&
		!teamQuery.isError &&
		team &&
		(!projectId || (!projectQuery.isError && project)),
	)
	const role = hasContext
		? team?.members.find((member) => member.userId === profileQuery.data?.id)?.role
		: undefined
	const roleLabel = role ? ROLE_LABELS[role] : undefined
	const name = getUserDisplayName(profileQuery.isError ? null : profileQuery.data)
	const roleSummary = roleLabel
		? `${roleLabel} команды «${team?.name}»`
		: pending
			? 'Роль в текущем контексте загружается'
			: 'Нет подтверждённой роли в выбранной команде или проекте'
	const roleDescription =
		roleLabel && project
			? `${roleSummary}: доступ к проекту «${project.name}»`
			: roleSummary

	return (
		<div
			className={cn(
				'mt-auto shrink-0 border-t border-sidebar-border py-3',
				isOpen ? 'px-3' : 'px-1.5',
			)}
		>
			<div
				className={cn('flex gap-2', isOpen ? 'items-center' : 'flex-col items-center')}
			>
				<UserSummary
					name={name}
					initials={getNameInitials(name)}
					roleLabel={roleLabel ?? 'Роль не определена'}
					roleDescription={roleDescription}
					roleTone={role ? ROLE_TONES[role] : undefined}
					neutral={!roleLabel}
					pending={pending}
					collapsed={!isOpen}
					className={isOpen ? 'flex-1' : 'w-full'}
					renderProfileLink={(children, className) => {
						const link = (
							<Link
								href={ROUTES.profile}
								className={className}
								aria-label='Личный кабинет'
								title={isOpen ? name : undefined}
								onClick={onNavigate}
							>
								{children}
							</Link>
						)
						return isOpen ? (
							link
						) : (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button asChild variant='ghost' size='icon'>
											{link}
										</Button>
									</TooltipTrigger>
									<TooltipContent side='right' sideOffset={8}>
										<div>Личный кабинет: {name}.</div>
										<div>
											{roleSummary}
											{roleLabel && project ? ':' : ''}
										</div>
										{roleLabel && project && <div>доступ к проекту «{project.name}»</div>}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)
					}}
				/>
				<LogoutButton iconOnly />
			</div>
		</div>
	)
}

export { SidebarUser }
