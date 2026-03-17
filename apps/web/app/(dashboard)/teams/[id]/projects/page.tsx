import { FEATURES } from '@/shared/config'
import { ProjectsPageView } from '@/views/projects'
import { notFound } from 'next/navigation'

export default function ProjectsPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return <ProjectsPageView />
}
