import { notFound } from 'next/navigation'

import { ProjectsPageView } from '@/views/projects'
import { FEATURES } from '@/shared/config'

export default function ProjectsPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return <ProjectsPageView />
}
