import ProjectBoardPage from '@/app/(dashboard)/teams/[id]/projects/[projectId]/board/page'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { FEATURE_KEYS } from '@repo/types'

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
	}: {
		teamId: string
		projectId: string
	}) => <div data-testid='project-board' data-team={teamId} data-project={projectId} />,
}))

beforeEach(() => {
	requireFeature.mockReset()
	requireFeature.mockResolvedValue(undefined)
})
afterEach(cleanup)

it('проверяет существующий флаг и передаёт параметры проекта без повторного декодирования', async () => {
	const params = { id: 'team/with%value', projectId: 'project /1' }
	render(await ProjectBoardPage({ params: Promise.resolve(params) }))
	expect(requireFeature).toHaveBeenCalledExactlyOnceWith(FEATURE_KEYS.BOARDS)
	expect(screen.getByTestId('feature-gate').getAttribute('data-feature')).toBe(
		FEATURE_KEYS.BOARDS,
	)
	expect(screen.getByTestId('project-board').getAttribute('data-team')).toBe(params.id)
	expect(screen.getByTestId('project-board').getAttribute('data-project')).toBe(
		params.projectId,
	)
})

it('не возвращает страницу, если серверная проверка отклонила доступ', async () => {
	const denied = new Error('not-found')
	requireFeature.mockRejectedValue(denied)
	await expect(
		ProjectBoardPage({
			params: Promise.resolve({ id: 'team-1', projectId: 'project-1' }),
		}),
	).rejects.toBe(denied)
	expect(screen.queryByTestId('project-board')).toBeNull()
})
