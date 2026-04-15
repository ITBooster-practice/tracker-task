import { cn } from '@repo/ui'

import {
	TEAM_SETTINGS_ROLE_OPTIONS,
	TEAM_SETTINGS_SECTION_ICONS,
	TEAM_SETTINGS_TEXT,
} from '../config/team-settings.constants'
import { TeamSettingsSection } from './team-settings-section'

const TeamSettingsRolesSection = () => {
	return (
		<TeamSettingsSection
			title={TEAM_SETTINGS_TEXT.roles.title}
			icon={TEAM_SETTINGS_SECTION_ICONS.roles}
		>
			<div className='grid gap-3 p-4 lg:grid-cols-3 lg:gap-5'>
				{TEAM_SETTINGS_ROLE_OPTIONS.map((role) => {
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
		</TeamSettingsSection>
	)
}

export { TeamSettingsRolesSection }
