import { FEATURES } from '@/hooks/use-feature-flag'
import { TeamSettingsPageView } from '@/views/teams'
import { notFound } from 'next/navigation'

export default function TeamSettingsPage() {
	if (!FEATURES.TEAM_SETTINGS) {
		notFound()
	}

	return <TeamSettingsPageView />
}
