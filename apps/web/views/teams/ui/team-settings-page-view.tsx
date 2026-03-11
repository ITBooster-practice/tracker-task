'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { TEAM_ROLES, type TeamRole } from '@repo/types'
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { Crown, Mail, Settings2, Shield, Trash2, UserPlus, Users } from '@repo/ui/icons'

import {
	teamDialogContentClassName,
	teamDialogFooterClassName,
	teamDialogFormClassName,
	teamDialogHeaderClassName,
	teamDialogInputClassName,
	teamDialogLabelClassName,
	teamDialogPrimaryButtonClassName,
	teamDialogSecondaryButtonClassName,
	teamDialogTitleClassName,
	teamPageHeaderClassName,
	teamPagePrimaryButtonClassName,
	teamPageSubtitleClassName,
	teamPageTitleClassName,
} from '../lib/styles'
import { getMockTeamSettings, type TeamSettingsMember } from '../model/mock-team-settings'

const roleOptions = [
	{
		value: TEAM_ROLES.OWNER,
		label: 'Owner',
		description: 'Полный доступ, управление командой и billing',
		icon: Crown,
		iconClassName: 'text-amber-400',
	},
	{
		value: TEAM_ROLES.ADMIN,
		label: 'Admin',
		description: 'Управление проектами, участниками и настройками',
		icon: Shield,
		iconClassName: 'text-primary',
	},
	{
		value: TEAM_ROLES.MEMBER,
		label: 'Member',
		description: 'Работа с задачами, комментарии, просмотр',
		icon: Users,
		iconClassName: 'text-muted-foreground',
	},
] as const

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

function getNameFromEmail(email: string) {
	const [localPart = 'Новый участник'] = email.split('@')

	return localPart
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join(' ')
}

function getRoleBadgeClassName(role: TeamRole) {
	switch (role) {
		case TEAM_ROLES.OWNER:
			return 'border-amber-400/15 bg-amber-400/10 text-amber-300'
		case TEAM_ROLES.ADMIN:
			return 'border-primary/15 bg-primary/10 text-primary'
		default:
			return 'border-border/60 bg-surface-2 text-muted-foreground'
	}
}

function TeamSettingsPageView() {
	const params = useParams<{ id: string }>()
	const teamId = params.id
	const teamSettings = useMemo(() => getMockTeamSettings(teamId), [teamId])
	const [members, setMembers] = useState<TeamSettingsMember[]>(teamSettings.members)
	const [inviteOpen, setInviteOpen] = useState(false)
	const [inviteEmail, setInviteEmail] = useState('')
	const [inviteRole, setInviteRole] = useState<TeamRole>(TEAM_ROLES.MEMBER)

	useEffect(() => {
		setMembers(teamSettings.members)
	}, [teamSettings])

	const isInviteDisabled =
		!inviteEmail.trim() ||
		!emailPattern.test(inviteEmail) ||
		members.some((member) => member.email.toLowerCase() === inviteEmail.toLowerCase())

	const handleRoleChange = (memberId: string, nextRole: string) => {
		setMembers((currentMembers) =>
			currentMembers.map((member) =>
				member.id === memberId ? { ...member, role: nextRole as TeamRole } : member,
			),
		)
	}

	const handleDeleteMember = (memberId: string) => {
		setMembers((currentMembers) =>
			currentMembers.filter((member) => member.id !== memberId),
		)
	}

	const handleInviteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isInviteDisabled) {
			return
		}

		const normalizedEmail = inviteEmail.trim().toLowerCase()

		setMembers((currentMembers) => [
			...currentMembers,
			{
				id: normalizedEmail,
				email: normalizedEmail,
				name: getNameFromEmail(normalizedEmail),
				role: inviteRole,
			},
		])
		setInviteOpen(false)
		setInviteEmail('')
		setInviteRole(TEAM_ROLES.MEMBER)
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={teamPageHeaderClassName}>
					<div>
						<h1 className={teamPageTitleClassName}>Настройки команды</h1>
						<p className={teamPageSubtitleClassName}>{teamSettings.name}</p>
					</div>

					<Button
						onClick={() => setInviteOpen(true)}
						className={teamPagePrimaryButtonClassName}
					>
						<UserPlus className='mr-2 size-4' />
						Пригласить
					</Button>
				</header>

				<div className='space-y-5'>
					<section className='rounded-lg border border-border bg-card p-3.5 shadow-[0_18px_32px_-28px_rgba(12,18,32,0.55)]'>
						<div className='mb-3 flex items-center gap-2'>
							<div className='flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary'>
								<Settings2 className='size-4' />
							</div>
							<h2 className='text-[14px] font-semibold tracking-tight'>Роли</h2>
						</div>

						<div className='grid gap-3 lg:grid-cols-3 lg:gap-5'>
							{roleOptions.map((role) => {
								const Icon = role.icon

								return (
									<div key={role.value} className='space-y-1'>
										<div className='flex items-center gap-2 text-[13px] font-semibold'>
											<Icon className={cn('size-4', role.iconClassName)} />
											<span>{role.label}</span>
										</div>
										<p className='max-w-[250px] text-[12px] leading-5 text-muted-foreground'>
											{role.description}
										</p>
									</div>
								)
							})}
						</div>
					</section>

					<section className='overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_18px_32px_-28px_rgba(12,18,32,0.55)]'>
						<div className='border-b border-border px-4 py-3.5'>
							<h2 className='text-[16px] font-semibold tracking-tight'>
								Участники ({members.length})
							</h2>
						</div>

						<div>
							{members.map((member) => {
								const isOwner = member.role === TEAM_ROLES.OWNER

								return (
									<div
										key={member.id}
										className='flex flex-col gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0 lg:min-h-[56px] lg:flex-row lg:items-center lg:justify-between'
									>
										<div className='flex min-w-0 items-center gap-3'>
											<Avatar className='size-9 border border-border/80'>
												<AvatarFallback className='bg-surface-2 text-[13px] font-medium text-muted-foreground'>
													{getInitials(member.name)}
												</AvatarFallback>
											</Avatar>

											<div className='min-w-0'>
												<div className='truncate text-[15px] font-medium leading-tight'>
													{member.name}
												</div>
												<div className='truncate text-[12px] leading-4 text-muted-foreground'>
													{member.email}
												</div>
											</div>
										</div>

										<div className='flex flex-wrap items-center gap-2.5 lg:justify-end'>
											<Badge
												variant='outline'
												className={cn(
													'h-6 rounded-full border px-3 text-[12px] font-medium',
													getRoleBadgeClassName(member.role),
												)}
											>
												{roleOptions.find((role) => role.value === member.role)?.label}
											</Badge>

											{isOwner ? null : (
												<>
													<Select
														value={member.role}
														onValueChange={(value) => handleRoleChange(member.id, value)}
													>
														<SelectTrigger className='h-9 w-[136px] rounded-[12px] border-border bg-background px-3.5 text-[14px] shadow-none'>
															<SelectValue placeholder='Выберите роль' />
														</SelectTrigger>
														<SelectContent className='border-border bg-popover'>
															{roleOptions
																.filter((role) => role.value !== TEAM_ROLES.OWNER)
																.map((role) => (
																	<SelectItem key={role.value} value={role.value}>
																		{role.label}
																	</SelectItem>
																))}
														</SelectContent>
													</Select>

													<Button
														variant='ghost'
														size='icon-sm'
														onClick={() => handleDeleteMember(member.id)}
														className='size-8 text-destructive hover:bg-destructive/10 hover:text-destructive'
														aria-label={`Удалить ${member.name}`}
													>
														<Trash2 className='size-[15px]' />
													</Button>
												</>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</section>
				</div>
			</div>

			<Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
				<DialogContent className={teamDialogContentClassName}>
					<form onSubmit={handleInviteSubmit} className={teamDialogFormClassName}>
						<DialogHeader className={teamDialogHeaderClassName}>
							<DialogTitle className={teamDialogTitleClassName}>
								Пригласить участника
							</DialogTitle>
						</DialogHeader>

						<div className='space-y-4'>
							<div className='space-y-1.5'>
								<Label htmlFor='invite-email' className={teamDialogLabelClassName}>
									Email
								</Label>
								<div className='relative'>
									<Mail className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										id='invite-email'
										type='email'
										autoFocus
										placeholder='user@company.com'
										value={inviteEmail}
										onChange={(event) => setInviteEmail(event.target.value)}
										className={cn(teamDialogInputClassName, 'pl-10')}
									/>
								</div>
							</div>

							<div className='space-y-1.5'>
								<Label htmlFor='invite-role' className={teamDialogLabelClassName}>
									Роль
								</Label>
								<Select
									value={inviteRole}
									onValueChange={(value) => setInviteRole(value as TeamRole)}
								>
									<SelectTrigger
										id='invite-role'
										className={cn(teamDialogInputClassName, 'px-3.5')}
									>
										<SelectValue placeholder='Выберите роль' />
									</SelectTrigger>
									<SelectContent className='border-border bg-popover'>
										{roleOptions
											.filter((role) => role.value !== TEAM_ROLES.OWNER)
											.map((role) => (
												<SelectItem key={role.value} value={role.value}>
													{role.label}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className={teamDialogFooterClassName}>
							<Button
								type='button'
								variant='outline'
								onClick={() => setInviteOpen(false)}
								className={teamDialogSecondaryButtonClassName}
							>
								Отмена
							</Button>
							<Button
								type='submit'
								disabled={isInviteDisabled}
								className={teamDialogPrimaryButtonClassName}
							>
								Отправить приглашение
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export { TeamSettingsPageView }
