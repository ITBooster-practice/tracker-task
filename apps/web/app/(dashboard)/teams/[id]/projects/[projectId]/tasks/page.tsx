import { notFound } from 'next/navigation'

import { ProjectTasksPageView } from '@/views/projects'
import { FEATURES } from '@/shared/config'

export default function ProjectTasksPage() {
	if (!FEATURES.TASKS) {
		notFound()
	}

	return <ProjectTasksPageView />
}
