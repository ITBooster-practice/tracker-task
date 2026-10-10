import { CreateTaskDialog, ProjectTasksPageView } from '@/views/tasks'

export default function TaskNewPage() {
	return (
		<>
			<ProjectTasksPageView />
			<CreateTaskDialog />
		</>
	)
}
