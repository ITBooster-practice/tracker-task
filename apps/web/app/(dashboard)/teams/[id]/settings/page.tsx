import { FEATURES } from '@/shared/config'
import { TeamSettingsPageView } from '@/views/teams'
import { notFound } from 'next/navigation'

export default function TeamSettingsPage() {
	if (!FEATURES.TEAM_SETTINGS) {
		notFound()
	}

	return <TeamSettingsPageView />
}
