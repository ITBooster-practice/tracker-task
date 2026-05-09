import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { ProjectDetailPageView } from '@/views/projects'
import { projectsKeys } from '@/shared/api/use-projects'
import { FEATURES } from '@/shared/config'

export default async function ProjectDetailPage({
	params,
}: {
	params: Promise<{ id: string; projectId: string }>
}) {
	if (!FEATURES.PROJECTS) {
		notFound()
	}

	const { id: teamId, projectId } = await params
	const cookieStore = await cookies()
	const cookieHeader = cookieStore
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
		.join('; ')

	const queryClient = new QueryClient()

	await queryClient.prefetchQuery({
		queryKey: projectsKeys.detail(teamId, projectId),
		queryFn: async () => {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/projects/${projectId}`,
				{ headers: { cookie: cookieHeader } },
			)
			if (!res.ok) return null
			return res.json()
		},
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ProjectDetailPageView />
		</HydrationBoundary>
	)
}
