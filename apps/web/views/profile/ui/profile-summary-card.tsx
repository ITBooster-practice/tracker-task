import { type FormEventHandler } from 'react'

import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	cn,
	Input,
	Label,
} from '@repo/ui'

import {
	profileCopy,
	profileFormFieldIds,
	type ProfileRoleSummary,
} from '../config/constants'
import {
	profileBadgeBaseClassName,
	profileInputClassName,
	profilePrimaryButtonClassName,
	profileSectionCardClassName,
	profileSummaryAvatarClassName,
	profileSummaryAvatarFallbackClassName,
	profileSummaryContentClassName,
	profileSummaryEmailClassName,
	profileSummaryFieldClassName,
	profileSummaryFormGridClassName,
	profileSummaryHeadingClassName,
	profileSummaryIdentityClassName,
	profileSummaryLabelClassName,
	profileSummaryMetaClassName,
	profileSummaryNameClassName,
	profileSummaryTopClassName,
} from '../lib/styles'

type ProfileSummaryCardProps = {
	displayName: string
	email: string
	formName: string
	formEmail: string
	initials: string
	isDirty: boolean
	primaryRole: ProfileRoleSummary
	onFormSubmit: FormEventHandler<HTMLFormElement>
	onNameChange: (value: string) => void
	onEmailChange: (value: string) => void
}

const ProfileSummaryCard = ({
	displayName,
	email,
	formName,
	formEmail,
	initials,
	isDirty,
	primaryRole,
	onFormSubmit,
	onNameChange,
	onEmailChange,
}: ProfileSummaryCardProps) => {
	return (
		<Card className={profileSectionCardClassName}>
			<CardContent className='px-0'>
				<form onSubmit={onFormSubmit}>
					<div className={profileSummaryTopClassName}>
						<div className={profileSummaryIdentityClassName}>
							<Avatar className={profileSummaryAvatarClassName}>
								<AvatarFallback className={profileSummaryAvatarFallbackClassName}>
									{initials}
								</AvatarFallback>
							</Avatar>

							<div className={profileSummaryContentClassName}>
								<div className={profileSummaryHeadingClassName}>
									<h2 className={profileSummaryNameClassName}>{displayName}</h2>
									<div className={profileSummaryMetaClassName}>
										<Badge
											variant='outline'
											className={cn(profileBadgeBaseClassName, primaryRole.className)}
										>
											{primaryRole.label}
										</Badge>
										<span className={profileSummaryEmailClassName}>{email}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className={profileSummaryFormGridClassName}>
						<div className={profileSummaryFieldClassName}>
							<Label
								htmlFor={profileFormFieldIds.name}
								className={profileSummaryLabelClassName}
							>
								{profileCopy.fields.name}
							</Label>
							<Input
								id={profileFormFieldIds.name}
								value={formName}
								onChange={(event) => onNameChange(event.target.value)}
								className={profileInputClassName}
							/>
						</div>

						<div className={profileSummaryFieldClassName}>
							<Label
								htmlFor={profileFormFieldIds.email}
								className={profileSummaryLabelClassName}
							>
								{profileCopy.fields.email}
							</Label>
							<Input
								id={profileFormFieldIds.email}
								value={formEmail}
								onChange={(event) => onEmailChange(event.target.value)}
								className={profileInputClassName}
							/>
						</div>

						<Button
							type='submit'
							disabled={!isDirty}
							className={cn(profilePrimaryButtonClassName, 'min-w-[96px]')}
						>
							{profileCopy.fields.save}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}

export { ProfileSummaryCard }
