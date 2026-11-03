import '@/test/mocks/api/boards-service.mock'

import ProjectBoardPage from '@/app/(dashboard)/teams/[id]/projects/[projectId]/board/page'
import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { FEATURE_KEYS } from '@repo/types'

import { boardsKeys } from '@/shared/api/boards-keys'

const { requireFeature } = vi.hoisted(() => ({ requireFeature: vi.fn() }))
vi.mock('@/shared/lib/feature-flags/server', () => ({
	requireServerFeature: requireFeature,
}))
vi.mock('@/features/feature-flags', () => ({
	FeatureGate: ({ children, feature }: React.PropsWithChildren<{ feature: string }>) => (
		<section data-testid='feature-gate' data-feature={feature}>
			{children}
		</section>
	),
}))
vi.mock('@/views/boards', () => ({
	ProjectBoardPageView: ({
		teamId,
		projectId,
		boardId,
	}: {
		teamId: string
		projectId: string
		boardId?: string
	}) => (
		<div
			data-testid='project-board'
			data-team={teamId}
			data-project={projectId}
			data-board={boardId}
		/>
	),
}))

let client: QueryClient
const renderPage = (page: React.ReactNode) =>
	render(<QueryClientProvider client={client}>{page}</QueryClientProvider>)

beforeEach(() => {
	client = new QueryClient()
	boardsServiceMock.getAll.mockReset().mockResolvedValue([createBoardListItemFixture()])
	requireFeature.mockReset()
	requireFeature.mockResolvedValue(undefined)
})
afterEach(() => {
	cleanup()
	client.clear()
})

it('проверяет существующий флаг и передаёт параметры проекта без повторного декодирования', async () => {
	const params = { id: 'team/with%value', projectId: 'project /1' }
	renderPage(await ProjectBoardPage({ params: Promise.resolve(params) }))
	expect(requireFeature).toHaveBeenCalledExactlyOnceWith(FEATURE_KEYS.BOARDS)
	expect(screen.getByTestId('feature-gate').getAttribute('data-feature')).toBe(
		FEATURE_KEYS.BOARDS,
	)
	expect(screen.getByTestId('project-board').getAttribute('data-team')).toBe(params.id)
	expect(screen.getByTestId('project-board').getAttribute('data-project')).toBe(
		params.projectId,
	)
})

it('передаёт boardId из URL без повторного декодирования', async () => {
	const boardId = 'board /with%value'
	renderPage(
		await ProjectBoardPage({
			params: Promise.resolve({ id: 'team-1', projectId: 'project-1' }),
			searchParams: Promise.resolve({ boardId }),
		}),
	)
	expect(screen.getByTestId('project-board').getAttribute('data-board')).toBe(boardId)
})

it('не возвращает страницу, если серверная проверка отклонила доступ', async () => {
	const denied = new Error('not-found')
	requireFeature.mockRejectedValue(denied)
	await expect(
		ProjectBoardPage({
			params: Promise.resolve({ id: 'team-1', projectId: 'project-1' }),
		}),
	).rejects.toBe(denied)
	expect(boardsServiceMock.getAll).not.toHaveBeenCalled()
	expect(screen.queryByTestId('project-board')).toBeNull()
})

it('hydrates the actual column metadata before the initial board render', async () => {
	const board = createBoardListItemFixture({ id: 'custom-board', isDefault: false })
	board.columns[0]!.title = 'Ожидает релиза'
	board.columns[0]!.color = 'orange'
	boardsServiceMock.getAll.mockResolvedValue([board])
	const page = await ProjectBoardPage({
		params: Promise.resolve({ id: 'team-1', projectId: 'project-1' }),
		searchParams: Promise.resolve({ boardId: board.id }),
	})
	renderPage(page)
	expect(client.getQueryData(boardsKeys.list('team-1', 'project-1'))).toEqual([board])
	expect(boardsServiceMock.getAll).toHaveBeenCalledExactlyOnceWith(
		'team-1',
		'project-1',
		expect.any(AbortSignal),
	)
})

it('keeps metadata isolated between server requests for different projects', async () => {
	const first = createBoardListItemFixture({ projectId: 'first' })
	const second = createBoardListItemFixture({ projectId: 'second' })
	boardsServiceMock.getAll.mockResolvedValueOnce([first]).mockResolvedValueOnce([second])
	await ProjectBoardPage({
		params: Promise.resolve({ id: 'team-1', projectId: 'first' }),
	})
	const page = await ProjectBoardPage({
		params: Promise.resolve({ id: 'team-1', projectId: 'second' }),
	})
	renderPage(page)
	expect(client.getQueryData(boardsKeys.list('team-1', 'first'))).toBeUndefined()
	expect(client.getQueryData(boardsKeys.list('team-1', 'second'))).toEqual([second])
})

it('lets the client retry when the server cannot load column metadata', async () => {
	boardsServiceMock.getAll.mockRejectedValue({ statusCode: 503, message: 'Unavailable' })
	renderPage(
		await ProjectBoardPage({
			params: Promise.resolve({ id: 'team-1', projectId: 'project-1' }),
		}),
	)
	expect(screen.getByTestId('project-board')).toBeDefined()
	expect(client.getQueryData(boardsKeys.list('team-1', 'project-1'))).toBeUndefined()
	expect(boardsServiceMock.getAll).toHaveBeenCalledOnce()
})
