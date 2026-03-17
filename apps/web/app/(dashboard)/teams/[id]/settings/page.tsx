import { notFound } from 'next/navigation'

import { TeamSettingsPageView } from '@/views/teams'
import { FEATURES } from '@/shared/config'

export default function TeamSettingsPage() {
	if (!FEATURES.TEAM_SETTINGS) {
		notFound()
	}

	return <TeamSettingsPageView />
}
