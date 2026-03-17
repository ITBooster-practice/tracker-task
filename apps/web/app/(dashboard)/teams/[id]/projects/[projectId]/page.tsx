import { notFound } from 'next/navigation'

import { ProjectDetailPageView } from '@/views/projects'
import { FEATURES } from '@/shared/config'

export default function ProjectDetailPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return <ProjectDetailPageView />
}
