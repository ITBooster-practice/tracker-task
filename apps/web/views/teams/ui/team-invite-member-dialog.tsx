import { type FormEvent } from 'react'

import {
	Button,
	cn,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerDescription,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	VStack,
} from '@repo/ui'
import { Mail } from '@repo/ui/icons'

import {
	TEAM_SETTINGS_ASSIGNABLE_ROLES,
	TEAM_SETTINGS_ROLE_OPTIONS,
	TEAM_SETTINGS_TEXT,
	type TeamAssignableRole,
} from '../config/team-settings.constants'
import {
	teamDialogContentClassName,
	teamDialogFooterClassName,
	teamDialogInputClassName,
	teamDialogLabelClassName,
	teamDialogPrimaryButtonClassName,
	teamDialogSecondaryButtonClassName,
	teamDialogTitleClassName,
} from '../lib/styles'

type TeamInviteMemberDialogProps = {
	email: string
	isOpen: boolean
	isPending: boolean
	isSubmitDisabled: boolean
	onClose: () => void
	onEmailChange: (value: string) => void
	onOpenChange: (open: boolean) => void
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	onRoleChange: (role: TeamAssignableRole) => void
	role: TeamAssignableRole
}

const TeamInviteMemberDialog = ({
	email,
	isOpen,
	isPending,
	isSubmitDisabled,
	onClose,
	onEmailChange,
	onOpenChange,
	onRoleChange,
	onSubmit,
	role,
}: TeamInviteMemberDialogProps) => {
	return (
		<DialogDrawer open={isOpen} onOpenChange={onOpenChange}>
			<DialogDrawerContent className={teamDialogContentClassName}>
				<form onSubmit={onSubmit}>
					<DialogDrawerHeader>
						<DialogDrawerTitle className={teamDialogTitleClassName}>
							{TEAM_SETTINGS_TEXT.invitations.inviteTitle}
						</DialogDrawerTitle>
						<DialogDrawerDescription>
							{TEAM_SETTINGS_TEXT.invitations.inviteDescription}
						</DialogDrawerDescription>
					</DialogDrawerHeader>

					<VStack spacing='md' className='p-4'>
						<div>
							<Label htmlFor='invite-email' className={teamDialogLabelClassName}>
								{TEAM_SETTINGS_TEXT.invitations.emailLabel}
							</Label>
							<div className='relative'>
								<Mail className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									id='invite-email'
									type='email'
									autoFocus
									placeholder={TEAM_SETTINGS_TEXT.invitations.emailPlaceholder}
									value={email}
									onChange={(event) => onEmailChange(event.target.value)}
									className={cn(teamDialogInputClassName, 'pl-10')}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='invite-role' className={teamDialogLabelClassName}>
								{TEAM_SETTINGS_TEXT.invitations.roleLabel}
							</Label>
							<Select
								value={role}
								onValueChange={(value) => onRoleChange(value as TeamAssignableRole)}
							>
								<SelectTrigger
									id='invite-role'
									className={cn(teamDialogInputClassName, 'w-full px-3.5')}
								>
									<SelectValue placeholder={TEAM_SETTINGS_TEXT.members.rolePlaceholder} />
								</SelectTrigger>
								<SelectContent className='border-border bg-popover'>
									{TEAM_SETTINGS_ROLE_OPTIONS.filter((option) =>
										TEAM_SETTINGS_ASSIGNABLE_ROLES.includes(
											option.value as (typeof TEAM_SETTINGS_ASSIGNABLE_ROLES)[number],
										),
									).map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</VStack>

					<DialogDrawerFooter className={teamDialogFooterClassName}>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={isPending}
							className={teamDialogSecondaryButtonClassName}
						>
							{TEAM_SETTINGS_TEXT.cancelAction}
						</Button>
						<Button
							type='submit'
							disabled={isSubmitDisabled || isPending}
							className={teamDialogPrimaryButtonClassName}
						>
							{isPending
								? TEAM_SETTINGS_TEXT.invitations.submitPendingAction
								: TEAM_SETTINGS_TEXT.invitations.submitAction}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { TeamInviteMemberDialog }
