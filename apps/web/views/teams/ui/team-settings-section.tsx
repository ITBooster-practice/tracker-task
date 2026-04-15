import { type ComponentType, type ReactNode } from 'react'

import { cn } from '@repo/ui'

import {
	teamSettingsSectionClassName,
	teamSettingsSectionDescriptionClassName,
	teamSettingsSectionHeaderClassName,
	teamSettingsSectionHeaderContentClassName,
	teamSettingsSectionIconClassName,
	teamSettingsSectionTitleClassName,
} from '../lib/styles'

type TeamSettingsSectionProps = {
	action?: ReactNode
	children: ReactNode
	description?: string
	icon: ComponentType<{ className?: string }>
	title: string
}

const TeamSettingsSection = ({
	action,
	children,
	description,
	icon: Icon,
	title,
}: TeamSettingsSectionProps) => {
	return (
		<section className={teamSettingsSectionClassName}>
			<div className={teamSettingsSectionHeaderClassName}>
				<div className={teamSettingsSectionHeaderContentClassName}>
					<div className={teamSettingsSectionIconClassName}>
						<Icon className='size-4' />
					</div>
					<div>
						<h2 className={teamSettingsSectionTitleClassName}>{title}</h2>
						{description ? (
							<p className={teamSettingsSectionDescriptionClassName}>{description}</p>
						) : null}
					</div>
				</div>

				<div className={cn({ 'shrink-0': action })}>{action}</div>
			</div>

			{children}
		</section>
	)
}

export { TeamSettingsSection }
