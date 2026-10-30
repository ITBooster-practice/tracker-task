'use client'

import { useParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useUserStore } from '@/entities/user'
import { useMe } from '@/shared/api/use-auth'
import { useProjectDetail, useProjectsList } from '@/shared/api/use-projects'
import { useTeamDetail, useTeamsList } from '@/shared/api/use-teams'
import { isApiError } from '@/shared/lib/api/utils'
import {
	resolveWorkspaceRoute,
	useWorkspaceStore,
} from '@/shared/lib/workspace-context/store'

const isUnavailable = (error: unknown) =>
	isApiError(error) && [403, 404].includes(error.statusCode)

export function useWorkspaceContext() {
	const profile = useMe()
	const session = useUserStore()
	const identityPending =
		session.sessionEnded ||
		Boolean(session.user && profile.data && session.user.id !== profile.data.id)
	const userId = identityPending ? null : (profile.data?.id ?? null)
	const pathname = usePathname() ?? ''
	const params = useParams<{ id?: string; projectId?: string }>()
	const state = useWorkspaceStore()
	const { hydrated, syncRoute, clearTeam, clearProject } = state
	const routeTeamId =
		pathname.startsWith('/teams/') && typeof params.id === 'string' && params.id !== 'new'
			? params.id
			: null
	const routeProjectId =
		routeTeamId && typeof params.projectId === 'string' && params.projectId !== 'new'
			? params.projectId
			: null
	const selected =
		state.hydrated && userId && !profile.isError
			? resolveWorkspaceRoute(state, userId, pathname, routeTeamId, routeProjectId)
			: { ownerId: null, teamId: null, projectId: null }
	const options = {
		accountId: userId ?? '',
		enabled: Boolean(state.hydrated && userId && !profile.isError),
	}
	const teamsQuery = useTeamsList({ page: 1, limit: 50 }, options)
	const teamQuery = useTeamDetail(selected.teamId ?? '', {
		...options,
		enabled: options.enabled && Boolean(selected.teamId),
	})
	const projectsQuery = useProjectsList(selected.teamId ?? '', undefined, options)
	const projectQuery = useProjectDetail(
		selected.teamId ?? '',
		selected.projectId ?? '',
		options,
	)
	const teamUnavailable = isUnavailable(teamQuery.error)
	const projectUnavailable =
		isUnavailable(projectQuery.error) ||
		Boolean(
			projectQuery.data &&
			(projectQuery.data.id !== selected.projectId ||
				projectQuery.data.teamId !== selected.teamId),
		)
	const teamId = teamUnavailable ? null : selected.teamId
	const projectId = teamId && !projectUnavailable ? selected.projectId : null
	const teams = teamsQuery.data?.data ?? []
	const projects = (projectsQuery.data?.data ?? []).filter(
		(project) => project.teamId === teamId,
	)
	const team = teamQuery.data?.id === teamId ? teamQuery.data : null
	const currentTeam = team ?? teams.find((item) => item.id === teamId) ?? null
	const currentProject =
		projectQuery.data?.id === projectId && projectQuery.data.teamId === teamId
			? projectQuery.data
			: (projects.find((item) => item.id === projectId) ?? null)
	const role =
		team?.members.find((member) => member.userId === userId)?.role ??
		teams.find((item) => item.id === teamId)?.currentUserRole

	useEffect(() => {
		if (!useWorkspaceStore.getState().hydrated) void useWorkspaceStore.persist.rehydrate()
	}, [])
	useEffect(() => {
		if (hydrated && userId && !profile.isError)
			syncRoute(userId, pathname, routeTeamId, routeProjectId)
	}, [
		hydrated,
		syncRoute,
		userId,
		pathname,
		routeTeamId,
		routeProjectId,
		profile.isError,
	])
	useEffect(() => {
		if (useWorkspaceStore.getState().ownerId !== userId) return
		if (selected.teamId && teamUnavailable) clearTeam(selected.teamId)
		else if (selected.teamId && selected.projectId && projectUnavailable)
			clearProject(selected.teamId, selected.projectId)
	}, [
		userId,
		selected.teamId,
		selected.projectId,
		teamUnavailable,
		projectUnavailable,
		clearTeam,
		clearProject,
	])

	return {
		teamId,
		projectId,
		currentTeam,
		currentProject,
		teams,
		projects,
		teamsLoading: Boolean(
			teamsQuery.isPending || (teamId && teamQuery.isPending && !currentTeam),
		),
		projectsLoading: Boolean(
			teamId &&
			(projectsQuery.isPending ||
				(projectId && projectQuery.isPending && !currentProject)),
		),
		canManageTeam: !teamId ? null : role ? role === 'OWNER' || role === 'ADMIN' : null,
		selectTeam: (id: string) => {
			if (!routeTeamId && userId && teams.some((item) => item.id === id))
				state.selectTeam(userId, id)
		},
		selectProject: (id: string) => {
			if (
				!routeTeamId &&
				userId &&
				teamId &&
				projects.some((item) => item.id === id && item.teamId === teamId)
			)
				state.selectProject(userId, teamId, id)
		},
	}
}
