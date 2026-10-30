import { type ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@repo/ui'

import {
	profileSectionCardClassName,
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
			<CardHeader className={profileSectionHeaderClassName}>
				<div className={profileSectionTitleRowClassName}>
					<div className={profileSectionIconWrapClassName}>{icon}</div>
					<div className='flex min-w-0 flex-wrap items-center gap-2'>
						<h2 className={profileSectionTitleClassName}>{title}</h2>
						{badge}
					</div>
				</div>
			</CardHeader>
			<CardContent className={profileSectionContentClassName}>{children}</CardContent>
		</Card>
	)
}

export { ProfileSection }
