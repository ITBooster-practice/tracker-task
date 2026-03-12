import { FEATURES } from '@/hooks/use-feature-flag'
import { ProjectDetailPageView } from '@/views/projects'
import { notFound } from 'next/navigation'

export default function ProjectDetailPage() {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	return <ProjectDetailPageView />
}
