import { vi, type MockedFunction } from 'vitest'

type TeamInvitationsService =
	typeof import('@/shared/lib/api/team-invitations-service').teamInvitationsService

type MockedTeamInvitationsService = {
	sendInvitation: MockedFunction<TeamInvitationsService['sendInvitation']>
	getTeamInvitations: MockedFunction<TeamInvitationsService['getTeamInvitations']>
	revokeInvitation: MockedFunction<TeamInvitationsService['revokeInvitation']>
	getMyInvitations: MockedFunction<TeamInvitationsService['getMyInvitations']>
	acceptInvitation: MockedFunction<TeamInvitationsService['acceptInvitation']>
	declineInvitation: MockedFunction<TeamInvitationsService['declineInvitation']>
}

export const teamInvitationsServiceMock: MockedTeamInvitationsService = {
	sendInvitation: vi.fn<TeamInvitationsService['sendInvitation']>(),
	getTeamInvitations: vi.fn<TeamInvitationsService['getTeamInvitations']>(),
	revokeInvitation: vi.fn<TeamInvitationsService['revokeInvitation']>(),
	getMyInvitations: vi.fn<TeamInvitationsService['getMyInvitations']>(),
	acceptInvitation: vi.fn<TeamInvitationsService['acceptInvitation']>(),
	declineInvitation: vi.fn<TeamInvitationsService['declineInvitation']>(),
}

export function resetTeamInvitationsServiceMock() {
	for (const mockFn of Object.values(teamInvitationsServiceMock)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/team-invitations-service', () => ({
	teamInvitationsService: teamInvitationsServiceMock,
}))
