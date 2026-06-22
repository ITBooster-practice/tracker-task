import { notFound } from 'next/navigation'

import { CreateTaskDialog, ProjectTasksPageView } from '@/views/tasks'
import { FEATURES } from '@/shared/config'

export default function TaskNewPage() {
	if (!FEATURES.TASKS) {
		notFound()
	}

	return (
		<>
			<ProjectTasksPageView />
			<CreateTaskDialog />
		</>
	)
}
