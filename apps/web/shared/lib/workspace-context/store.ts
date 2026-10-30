import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type WorkspaceSelection = {
	ownerId: string | null
	teamId: string | null
	projectId: string | null
}

type WorkspaceStore = WorkspaceSelection & {
	hydrated: boolean
	routeKey: string | null
	syncRoute: (
		ownerId: string,
		routeKey: string,
		teamId: string | null,
		projectId: string | null,
	) => void
	selectTeam: (ownerId: string, teamId: string) => void
	selectProject: (ownerId: string, teamId: string, projectId: string) => void
	bindAccount: (ownerId: string) => void
	clearTeam: (teamId: string) => void
	clearProject: (teamId: string, projectId: string) => void
	clear: () => void
}

const emptySelection: WorkspaceSelection = {
	ownerId: null,
	teamId: null,
	projectId: null,
}

export function resolveWorkspaceRoute(
	state: WorkspaceSelection & { routeKey: string | null },
	ownerId: string,
	routeKey: string,
	teamId: string | null,
	projectId: string | null,
): WorkspaceSelection {
	const current = state.ownerId === ownerId ? state : { ...emptySelection, ownerId }
	if (state.ownerId === ownerId && state.routeKey === routeKey) return current
	if (!teamId) return current
	return {
		ownerId,
		teamId,
		projectId: projectId ?? (current.teamId === teamId ? current.projectId : null),
	}
}

const storage = {
	getItem: (key: string) => {
		try {
			return window.localStorage.getItem(key)
		} catch {
			return null
		}
	},
	setItem: (key: string, value: string) => {
		try {
			window.localStorage.setItem(key, value)
		} catch {
			/* Storage may be unavailable. */
		}
	},
	removeItem: (key: string) => {
		try {
			window.localStorage.removeItem(key)
		} catch {
			/* Storage may be unavailable. */
		}
	},
}

export const useWorkspaceStore = create<WorkspaceStore>()(
	persist(
		(set) => ({
			...emptySelection,
			hydrated: false,
			routeKey: null,
			syncRoute: (ownerId, routeKey, teamId, projectId) =>
				set((state) => {
					if (state.ownerId === ownerId && state.routeKey === routeKey) return state
					return {
						...resolveWorkspaceRoute(state, ownerId, routeKey, teamId, projectId),
						routeKey,
					}
				}),
			selectTeam: (ownerId, teamId) =>
				set((state) => ({
					ownerId,
					teamId,
					projectId:
						state.ownerId === ownerId && state.teamId === teamId ? state.projectId : null,
				})),
			selectProject: (ownerId, teamId, projectId) =>
				set((state) =>
					state.ownerId === ownerId && state.teamId === teamId ? { projectId } : state,
				),
			bindAccount: (ownerId) =>
				set((state) =>
					state.ownerId === ownerId
						? state
						: {
								...emptySelection,
								ownerId,
								routeKey: null,
							},
				),
			clearTeam: (teamId) =>
				set((state) =>
					state.teamId === teamId ? { teamId: null, projectId: null } : state,
				),
			clearProject: (teamId, projectId) =>
				set((state) =>
					state.teamId === teamId && state.projectId === projectId
						? { projectId: null }
						: state,
				),
			clear: () => set({ ...emptySelection, routeKey: null }),
		}),
		{
			name: 'workspace-context',
			storage: createJSONStorage(() => storage),
			skipHydration: true,
			partialize: ({ ownerId, teamId, projectId }) => ({ ownerId, teamId, projectId }),
			merge: (persisted, current) => {
				const saved = persisted as Partial<WorkspaceSelection> | null
				const ownerId = typeof saved?.ownerId === 'string' ? saved.ownerId : null
				const teamId = ownerId && typeof saved?.teamId === 'string' ? saved.teamId : null
				const projectId =
					teamId && typeof saved?.projectId === 'string' ? saved.projectId : null
				return { ...current, ownerId, teamId, projectId, routeKey: null }
			},
			onRehydrateStorage: () => () => useWorkspaceStore.setState({ hydrated: true }),
		},
	),
)
