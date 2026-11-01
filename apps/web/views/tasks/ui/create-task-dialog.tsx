'use client'

import { useParams, useRouter } from 'next/navigation'

import { TaskCreateDialog } from '@/features/tasks'
import { teamRoutes } from '@/shared/config'

export function CreateTaskDialog({ intercepted = false }: { intercepted?: boolean }) {
	const router = useRouter()
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	return (
		<TaskCreateDialog
			teamId={teamId}
			projectId={projectId}
			onClose={() =>
				intercepted
					? router.back()
					: router.replace(teamRoutes.projectTasks(teamId, projectId))
			}
		/>
	)
}
