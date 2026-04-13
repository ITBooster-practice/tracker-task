import { vi, type MockedFunction } from 'vitest'

type TeamsService = typeof import('@/shared/lib/api/teams-service').teamsService

type MockedTeamsService = {
	getAll: MockedFunction<TeamsService['getAll']>
	getById: MockedFunction<TeamsService['getById']>
	create: MockedFunction<TeamsService['create']>
	update: MockedFunction<TeamsService['update']>
	delete: MockedFunction<TeamsService['delete']>
}

export const teamsServiceMock: MockedTeamsService = {
	getAll: vi.fn<TeamsService['getAll']>(),
	getById: vi.fn<TeamsService['getById']>(),
	create: vi.fn<TeamsService['create']>(),
	update: vi.fn<TeamsService['update']>(),
	delete: vi.fn<TeamsService['delete']>(),
}

export function resetTeamsServiceMock() {
	for (const mockFn of Object.values(teamsServiceMock)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/teams-service', () => ({
	teamsService: teamsServiceMock,
}))
