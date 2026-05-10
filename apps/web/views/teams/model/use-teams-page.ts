import { useMemo, useState } from 'react'

import type { PaginationMeta } from '@repo/types'
import { usePagination } from '@repo/ui'

import { useTeamsList } from '@/shared/api/use-teams'

import { mapTeamListItemToTeamCardModel } from '../lib/mappers'
import type { TeamCardModel } from './types'

export interface UseTeamsPageResult {
	allTeams: TeamCardModel[]
	filteredTeams: TeamCardModel[]
	isLoading: boolean
	isError: boolean
	searchQuery: string
	setSearchQuery: (query: string) => void
	refetch: () => void
	meta: PaginationMeta | undefined
	setPage: (page: number) => void
}

export function useTeamsPage(): UseTeamsPageResult {
	const [searchQuery, setSearchQuery] = useState('')
	const { paginationParams, setPage } = usePagination()
	const { data, isLoading, isError, refetch } = useTeamsList(paginationParams)

	const allTeams = useMemo(
		() => (data?.data ?? []).map(mapTeamListItemToTeamCardModel),
		[data],
	)

	const normalizedQuery = searchQuery.trim().toLowerCase()
	const filteredTeams = normalizedQuery
		? allTeams.filter((team) => team.name.toLowerCase().includes(normalizedQuery))
		: allTeams

	const handleSetSearchQuery = (query: string) => {
		setSearchQuery(query)
		setPage(1)
	}

	return {
		allTeams,
		filteredTeams,
		isLoading,
		isError,
		searchQuery,
		setSearchQuery: handleSetSearchQuery,
		refetch,
		meta: data?.meta,
		setPage,
	}
}
