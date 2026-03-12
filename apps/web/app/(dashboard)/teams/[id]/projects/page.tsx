import { FEATURES } from '@/hooks/use-feature-flag'
import { ProjectsPageView } from '@/views/projects'
import { notFound } from 'next/navigation'

export default function ProjectsPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return <ProjectsPageView />
}
