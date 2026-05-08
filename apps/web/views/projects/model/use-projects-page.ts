import { useState } from 'react'

import type { Project } from '@repo/types'

import { useProjectsList } from '@/shared/api/use-projects'

export interface UseProjectsPageResult {
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
		allProjects,
		filteredProjects,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery,
		refetch,
	}
}
