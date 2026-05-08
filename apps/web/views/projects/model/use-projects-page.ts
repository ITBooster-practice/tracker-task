import { useState } from 'react'

import type { Project } from '@repo/types'

import { useProjectsList } from '@/shared/api/use-projects'
import { useTeamsList } from '@/shared/api/use-teams'

export interface UseProjectsPageResult {
	teamName: string | undefined
	allProjects: Project[]
	filteredProjects: Project[]
	isLoading: boolean
	isError: boolean
	searchQuery: string
	setSearchQuery: (query: string) => void
	refetch: () => void
}

export function useProjectsPage(teamId: string): UseProjectsPageResult {
	const [searchQuery, setSearchQuery] = useState('')
	const { data: teamsData } = useTeamsList({ page: 1, limit: 10 })
	const teamName = teamsData?.data.find((t) => t.id === teamId)?.name
	const { data, isLoading, isError, refetch } = useProjectsList(teamId)

	const allProjects = data?.data ?? []
	const normalizedQuery = searchQuery.trim().toLowerCase()

	const filteredProjects = normalizedQuery
		? allProjects.filter((project) =>
				[project.name, project.description ?? ''].some((value) =>
					value.toLowerCase().includes(normalizedQuery),
				),
			)
		: allProjects

	return {
		teamName,
		allProjects,
		filteredProjects,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery,
		refetch,
	}
}
