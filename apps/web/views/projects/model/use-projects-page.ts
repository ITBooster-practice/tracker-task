import { useState } from 'react'

import type { PaginationMeta, Project } from '@repo/types'
import { usePagination } from '@repo/ui'

import { useProjectsList } from '@/shared/api/use-projects'
import { useTeamName } from '@/shared/api/use-teams'

export interface UseProjectsPageResult {
	teamName: string | undefined
	allProjects: Project[]
	filteredProjects: Project[]
	isLoading: boolean
	isError: boolean
	searchQuery: string
	setSearchQuery: (query: string) => void
	refetch: () => void
	meta: PaginationMeta | undefined
	setPage: (page: number) => void
}

export function useProjectsPage(teamId: string): UseProjectsPageResult {
	const [searchQuery, setSearchQuery] = useState('')
	const { paginationParams, setPage } = usePagination()
	const teamName = useTeamName(teamId)
	const { data, isLoading, isError, refetch } = useProjectsList(teamId, paginationParams)

	const allProjects = data?.data ?? []
	const normalizedQuery = searchQuery.trim().toLowerCase()

	const filteredProjects = normalizedQuery
		? allProjects.filter((project) =>
				[project.name, project.description ?? ''].some((value) =>
					value.toLowerCase().includes(normalizedQuery),
				),
			)
		: allProjects

	const handleSetSearchQuery = (query: string) => {
		setSearchQuery(query)
		setPage(1)
	}

	return {
		teamName,
		allProjects,
		filteredProjects,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery: handleSetSearchQuery,
		refetch,
		meta: data?.meta,
		setPage,
	}
}
