import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkspaceContext } from '@/widgets/main-layout/model/use-workspace-context'
import { useUserStore } from '@/entities/user'
import { useDeleteProject } from '@/shared/api/use-projects'
import { useDeleteTeam } from '@/shared/api/use-teams'
import { projectsService } from '@/shared/lib/api/projects-service'
import { teamsService } from '@/shared/lib/api/teams-service'
import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

const navigation = vi.hoisted(() => ({ pathname: '/teams/a/projects/p' }))
const profile = vi.hoisted(() => ({
	data: { id: 'user-1', name: 'User', email: 'user@example.test' } as
		| { id: string; name: string; email: string }
		| undefined,
	isError: false,
}))
vi.mock('next/navigation', () => ({
	usePathname: () => navigation.pathname,
	useParams: () => {
		const parts = navigation.pathname.split('/').filter(Boolean)
		return parts[0] === 'teams'
			? { id: parts[1], projectId: parts[2] === 'projects' ? parts[3] : undefined }
			: {}
	},
}))
vi.mock('@/shared/api/use-auth', () => ({ useMe: () => profile }))
vi.mock('@/shared/lib/api/teams-service', () => ({
	teamsService: { getAll: vi.fn(), getById: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/shared/lib/api/projects-service', () => ({
	projectsService: { getAll: vi.fn(), getById: vi.fn(), delete: vi.fn() },
}))

const user = { id: 'user-1', name: 'User', email: 'user@example.test' }
const team = (id = 'a') =>
	({ id, name: `Team ${id}`, members: [{ userId: user.id, role: 'OWNER' }] }) as Awaited<
		ReturnType<typeof teamsService.getById>
	>
const project = (teamId = 'a', id = 'p') =>
	({ id, teamId, name: `Project ${id}` }) as Awaited<
		ReturnType<typeof projectsService.getById>
	>
const page = <T,>(data: T[]) => ({
	data,
	meta: { page: 1, limit: 50, total: data.length, totalPages: 1 },
})
let queryClient: QueryClient
const wrapper = ({ children }: React.PropsWithChildren) => (
	<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

beforeEach(() => {
	vi.resetAllMocks()
	localStorage.clear()
	useUserStore.getState().clearUser()
	useWorkspaceStore.setState({ hydrated: true })
	useUserStore.getState().setUser(user)
	profile.data = user
	profile.isError = false
	navigation.pathname = '/teams/a/projects/p'
	queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, retryDelay: 0, staleTime: 0 },
			mutations: { retry: false },
		},
	})
	vi.mocked(teamsService.getAll).mockResolvedValue(page([]))
	vi.mocked(teamsService.getById).mockImplementation(async (id) => team(id))
	vi.mocked(projectsService.getAll).mockResolvedValue(page([]))
	vi.mocked(projectsService.getById).mockImplementation(async (teamId, id) =>
		project(teamId, id),
	)
	vi.mocked(projectsService.delete).mockResolvedValue(undefined)
	vi.mocked(teamsService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
})
afterEach(() => {
	cleanup()
	queryClient.clear()
})

describe('workspace context and remote validation', () => {
	it('keeps an explicit URL authoritative until selector navigation actually completes', async () => {
		vi.mocked(teamsService.getAll).mockResolvedValue(
			page([
				{ ...team('a'), currentUserRole: 'OWNER', membersCount: 1 },
				{ ...team('b'), currentUserRole: 'OWNER', membersCount: 1 },
			]),
		)
		vi.mocked(projectsService.getAll).mockResolvedValue(
			page([project('a', 'p'), project('a', 'q')]),
		)
		const { result, rerender } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(result.current.projects).toHaveLength(2))
		act(() => {
			result.current.selectTeam('b')
			result.current.selectProject('q')
		})
		expect(result.current).toMatchObject({ teamId: 'a', projectId: 'p' })
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'a', projectId: 'p' })
		navigation.pathname = '/teams/b/projects'
		rerender()
		expect(result.current).toMatchObject({ teamId: 'b', projectId: null })
	})
	it('keeps context through global pages and back/forward even when absent from the first list page', async () => {
		const { result, rerender } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(result.current.currentProject?.name).toBe('Project p'))
		expect(result.current.currentTeam?.name).toBe('Team a')
		expect(result.current.teams).toEqual([])
		for (const path of [
			'/teams',
			'/profile',
			'/admin/feature-flags',
			'/teams/a/projects/p/board',
			'/teams',
		]) {
			navigation.pathname = path
			rerender()
			expect(result.current).toMatchObject({ teamId: 'a', projectId: 'p' })
		}
		navigation.pathname = '/teams/b/projects/q'
		rerender()
		expect(result.current).toMatchObject({ teamId: 'b', projectId: 'q' })
		navigation.pathname = '/teams/a/projects/p'
		rerender()
		expect(result.current).toMatchObject({ teamId: 'a', projectId: 'p' })
	})
	it('restores persisted context on a global route only after identity is known', async () => {
		useWorkspaceStore.setState({
			ownerId: null,
			teamId: null,
			projectId: null,
			routeKey: null,
			hydrated: false,
		})
		localStorage.setItem(
			'workspace-context',
			JSON.stringify({
				state: { ownerId: user.id, teamId: 'a', projectId: 'p' },
				version: 0,
			}),
		)
		profile.data = undefined
		navigation.pathname = '/profile'
		const { result, rerender } = renderHook(useWorkspaceContext, { wrapper })
		expect(result.current.teamId).toBeNull()
		profile.data = user
		rerender()
		await waitFor(() => expect(result.current.currentProject?.id).toBe('p'))
		expect(result.current.teamId).toBe('a')
	})
	it.each([403, 404])(
		'clears revoked/deleted team after confirmed %s and does not reseed from the same URL',
		async (statusCode) => {
			vi.mocked(teamsService.getById).mockRejectedValue({
				statusCode,
				message: 'Unavailable',
			})
			const { result, rerender } = renderHook(useWorkspaceContext, { wrapper })
			await waitFor(() => expect(useWorkspaceStore.getState().teamId).toBeNull())
			rerender()
			expect(result.current).toMatchObject({ teamId: null, projectId: null })
			expect(useWorkspaceStore.getState().teamId).toBeNull()
		},
	)
	it('clears only the project on a confirmed project error', async () => {
		vi.mocked(projectsService.getById).mockRejectedValue({
			statusCode: 404,
			message: 'Deleted',
		})
		const { result } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(result.current.projectId).toBeNull())
		expect(result.current.teamId).toBe('a')
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'a', projectId: null })
	})
	it('retains the selection on transient server failures and empty/loading lists', async () => {
		vi.mocked(teamsService.getById).mockRejectedValue({
			statusCode: 503,
			message: 'Temporary',
		})
		vi.mocked(projectsService.getById).mockRejectedValue({
			statusCode: 500,
			message: 'Temporary',
		})
		const { result } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(teamsService.getById).toHaveBeenCalledTimes(4))
		expect(result.current).toMatchObject({ teamId: 'a', projectId: 'p' })
		expect(useWorkspaceStore.getState()).toMatchObject({ teamId: 'a', projectId: 'p' })
	})
	it('rejects a project response belonging to a different team', async () => {
		vi.mocked(projectsService.getById).mockResolvedValue(project('foreign'))
		const { result } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(result.current.projectId).toBeNull())
		expect(result.current.teamId).toBe('a')
	})
	it('clears selection immediately after successful deletion while keeping the remaining level', async () => {
		const { result } = renderHook(
			() => ({
				context: useWorkspaceContext(),
				deleteProject: useDeleteProject(),
				deleteTeam: useDeleteTeam(),
			}),
			{ wrapper },
		)
		await waitFor(() => expect(result.current.context.currentProject?.id).toBe('p'))
		await act(() =>
			result.current.deleteProject.mutateAsync({ teamId: 'a', projectId: 'p' }),
		)
		expect(result.current.context).toMatchObject({ teamId: 'a', projectId: null })
		await act(() => result.current.deleteTeam.mutateAsync('a'))
		expect(result.current.context).toMatchObject({ teamId: null, projectId: null })
	})
	it('isolates account query caches and ignores a late previous-account error', async () => {
		let rejectOld!: (error: unknown) => void
		vi.mocked(teamsService.getById).mockImplementationOnce(
			() =>
				new Promise((_, reject) => {
					rejectOld = reject
				}),
		)
		const { result, rerender } = renderHook(useWorkspaceContext, { wrapper })
		await waitFor(() => expect(teamsService.getById).toHaveBeenCalled())
		const other = { ...user, id: 'user-2' }
		act(() => {
			useUserStore.getState().setUser(other)
			profile.data = other
			navigation.pathname = '/profile'
		})
		rerender()
		expect(result.current).toMatchObject({
			teamId: null,
			projectId: null,
			currentTeam: null,
		})
		await act(async () => rejectOld({ statusCode: 403, message: 'Previous session' }))
		expect(useWorkspaceStore.getState()).toMatchObject({
			ownerId: other.id,
			teamId: null,
			projectId: null,
		})
		expect(
			queryClient
				.getQueryCache()
				.findAll({ queryKey: ['teams', 'list'] })
				.map((query) => query.queryKey.at(-1)),
		).toEqual(expect.arrayContaining([{ accountId: user.id }, { accountId: other.id }]))
	})
})
