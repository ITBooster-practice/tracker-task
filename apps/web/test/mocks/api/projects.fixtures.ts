import type { Project } from '@repo/types'

export function createProjectFixture(overrides?: Partial<Project>): Project {
	return {
		id: 'project-1',
		name: 'Test Project',
		description: null,
		teamId: 'team-1',
		createdById: 'user-1',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	}
}
