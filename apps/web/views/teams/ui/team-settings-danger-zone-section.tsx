import { Button } from '@repo/ui'

import {
	TEAM_SETTINGS_SECTION_ICONS,
	TEAM_SETTINGS_TEXT,
} from '../config/team-settings.constants'
import {
	teamSettingsDangerButtonClassName,
	teamSettingsSectionBodyClassName,
} from '../lib/styles'
import { TeamSettingsSection } from './team-settings-section'

type TeamSettingsDangerZoneSectionProps = {
	isPending: boolean
	onDeleteTeam: () => void
}

const TeamSettingsDangerZoneSection = ({
	isPending,
	onDeleteTeam,
}: TeamSettingsDangerZoneSectionProps) => {
	return (
		<TeamSettingsSection
			title={TEAM_SETTINGS_TEXT.dangerZone.title}
			description={TEAM_SETTINGS_TEXT.dangerZone.description}
			icon={TEAM_SETTINGS_SECTION_ICONS.dangerZone}
		>
			<div className={teamSettingsSectionBodyClassName}>
				<Button
					type='button'
					variant='destructive'
					onClick={onDeleteTeam}
					disabled={isPending}
					className={teamSettingsDangerButtonClassName}
				>
					{isPending
						? TEAM_SETTINGS_TEXT.dangerZone.dialogPending
						: TEAM_SETTINGS_TEXT.dangerZone.action}
				</Button>
			</div>
		</TeamSettingsSection>
	)
}

export { TeamSettingsDangerZoneSection }
