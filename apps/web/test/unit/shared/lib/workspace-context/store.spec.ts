import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from '@/entities/user'
import {
	resolveWorkspaceRoute,
	useWorkspaceStore,
} from '@/shared/lib/workspace-context/store'

const user = { id: 'user-1', name: 'User', email: 'user@example.test' }
const select = () =>
	useWorkspaceStore.getState().syncRoute(user.id, '/teams/a/projects/p', 'a', 'p')

beforeEach(() => {
	localStorage.clear()
	useWorkspaceStore.getState().clear()
	useWorkspaceStore.setState({ hydrated: true })
})

describe('workspace selection', () => {
	it('keeps the selection on global routes and same-team routes', () => {
		select()
		for (const path of ['/teams', '/profile', '/admin/feature-flags']) {
			useWorkspaceStore.getState().syncRoute(user.id, path, null, null)
			expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'a', projectId: 'p' })
		}
		useWorkspaceStore.getState().syncRoute(user.id, '/teams/a/projects', 'a', null)
		expect(useWorkspaceStore.getState().projectId).toBe('p')
	})
	it('uses URL ids on direct navigation and back/forward without choosing defaults', () => {
		select()
		useWorkspaceStore.getState().syncRoute(user.id, '/teams/b/projects/q', 'b', 'q')
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'b', projectId: 'q' })
		useWorkspaceStore.getState().syncRoute(user.id, '/teams/a/projects/p', 'a', 'p')
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'a', projectId: 'p' })
		useWorkspaceStore.getState().selectTeam(user.id, 'b')
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'b', projectId: null })
		useWorkspaceStore.getState().selectProject(user.id, 'a', 'p')
		expect(useWorkspaceStore.getState().projectId).toBeNull()
	})
	it('keeps invalidated ids cleared on the same URL and ignores late invalidations of another selection', () => {
		select()
		useWorkspaceStore.getState().clearProject('a', 'p')
		const state = useWorkspaceStore.getState()
		expect(
			resolveWorkspaceRoute(state, user.id, state.routeKey!, 'a', 'p').projectId,
		).toBeNull()
		useWorkspaceStore.getState().syncRoute(user.id, '/teams/b/projects/q', 'b', 'q')
		useWorkspaceStore.getState().clearTeam('a')
		useWorkspaceStore.getState().clearProject('a', 'p')
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'b', projectId: 'q' })
	})
	it('persists only account-scoped ids and restores them after reload on a global page', async () => {
		select()
		const saved = localStorage.getItem('workspace-context')!
		expect(JSON.parse(saved).state).toEqual({
			ownerId: user.id,
			teamId: 'a',
			projectId: 'p',
		})
		useWorkspaceStore.getState().clear()
		localStorage.setItem('workspace-context', saved)
		await useWorkspaceStore.persist.rehydrate()
		expect(useWorkspaceStore.getState()).toMatchObject({
			hydrated: true,
			routeKey: null,
			teamId: 'a',
			projectId: 'p',
		})
		expect(
			resolveWorkspaceRoute(useWorkspaceStore.getState(), user.id, '/profile', null, null)
				.projectId,
		).toBe('p')
	})
	it('does not expose another account selection and clears it on logout', () => {
		select()
		expect(
			resolveWorkspaceRoute(
				useWorkspaceStore.getState(),
				'other',
				'/profile',
				null,
				null,
			),
		).toMatchObject({ ownerId: 'other', teamId: null, projectId: null })
		useUserStore.getState().setUser(user)
		useUserStore.getState().clearUser()
		expect(useWorkspaceStore.getState()).toMatchObject({
			ownerId: null,
			teamId: null,
			projectId: null,
		})
		expect(JSON.parse(localStorage.getItem('workspace-context')!).state.teamId).toBeNull()
	})
	it('tolerates corrupt or unavailable storage', async () => {
		localStorage.setItem('workspace-context', '{invalid json')
		await useWorkspaceStore.persist.rehydrate()
		expect(useWorkspaceStore.getState().hydrated).toBe(true)
		expect(useWorkspaceStore.getState().teamId).toBeNull()
	})
})
