import { type ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle, cn } from '@repo/ui'

import {
	profileSectionCardClassName,
	profileSectionCompactHeaderClassName,
	profileSectionContentClassName,
	profileSectionHeaderClassName,
	profileSectionIconWrapClassName,
	profileSectionTitleClassName,
	profileSectionTitleRowClassName,
} from '../lib/styles'

type ProfileSectionProps = {
	badge?: ReactNode
	children: ReactNode
	icon: ReactNode
	title: string
}

const ProfileSection = ({ badge, children, icon, title }: ProfileSectionProps) => {
	return (
		<Card className={profileSectionCardClassName}>
			<CardHeader
				className={cn(
					profileSectionHeaderClassName,
					profileSectionCompactHeaderClassName,
				)}
			>
				<div className={profileSectionTitleRowClassName}>
					<div className={profileSectionIconWrapClassName}>{icon}</div>
					<div className='flex min-w-0 items-center gap-1.5'>
						<CardTitle className={profileSectionTitleClassName}>{title}</CardTitle>
						{badge}
					</div>
				</div>
			</CardHeader>
			<CardContent className={profileSectionContentClassName}>{children}</CardContent>
		</Card>
	)
}

export { ProfileSection }
