import { vi, type MockedFunction } from 'vitest'

type TeamMembersService =
	typeof import('@/shared/lib/api/team-members-service').teamMembersService

type MockedTeamMembersService = {
	getMembers: MockedFunction<TeamMembersService['getMembers']>
	changeRole: MockedFunction<TeamMembersService['changeRole']>
	removeMember: MockedFunction<TeamMembersService['removeMember']>
}

export const teamMembersServiceMock: MockedTeamMembersService = {
	getMembers: vi.fn<TeamMembersService['getMembers']>(),
	changeRole: vi.fn<TeamMembersService['changeRole']>(),
	removeMember: vi.fn<TeamMembersService['removeMember']>(),
}

export function resetTeamMembersServiceMock() {
	for (const mockFn of Object.values(teamMembersServiceMock)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/team-members-service', () => ({
	teamMembersService: teamMembersServiceMock,
}))
