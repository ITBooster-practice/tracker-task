import { AxiosHeaders, type AxiosResponse } from 'axios'

import {
	TEAM_INVITATION_STATUSES,
	TEAM_ROLES,
	type DeleteTeamResponse,
	type MyInvitation,
	type TeamInvitation,
} from '@repo/types'

import type {
	MyInvitationApiResponse,
	TeamApiResponse,
	TeamInvitationApiResponse,
	TeamMemberApiResponse,
} from '@/shared/lib/api/teams-normalizers'

import {
	createTeamFixture,
	createTeamListItemFixture,
	createTeamMemberFixture,
} from '../teams.fixtures'

export { createTeamFixture, createTeamListItemFixture, createTeamMemberFixture }

export function axiosResponse<T>(data: T): AxiosResponse<T> {
	return {
		data,
		status: 200,
		statusText: 'OK',
		headers: {},
		config: { headers: new AxiosHeaders() },
	}
}

export function createNestedTeamMemberApiFixture(
	overrides?: Partial<Extract<TeamMemberApiResponse, { user: unknown }>>,
): TeamMemberApiResponse {
	return {
		id: 'member-1',
		userId: 'user-1',
		role: TEAM_ROLES.ADMIN,
		joinedAt: '2024-02-01',
		user: {
			id: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
		},
		...overrides,
	}
}

export function createTeamApiFixture(
	overrides?: Partial<TeamApiResponse>,
): TeamApiResponse {
	return {
		...createTeamFixture(),
		members: [],
		...overrides,
	}
}

export function createTeamInvitationFixture(
	overrides?: Partial<TeamInvitation>,
): TeamInvitation {
	return {
		id: 'inv-1',
		teamId: 'team-1',
		invitedById: 'user-1',
		email: 'new@test.com',
		role: TEAM_ROLES.MEMBER,
		status: TEAM_INVITATION_STATUSES.PENDING,
		token: 'token-1',
		expiresAt: '2026-04-11T12:00:00.000Z',
		createdAt: '2026-04-09T12:00:00.000Z',
		updatedAt: '2026-04-09T12:00:00.000Z',
		team: {
			id: 'team-1',
			name: 'Dream Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
		},
		...overrides,
	}
}

export function createTeamInvitationApiFixture(
	overrides?: Partial<TeamInvitationApiResponse>,
): TeamInvitationApiResponse {
	return {
		...createTeamInvitationFixture(),
		...overrides,
	}
}

export function createMyInvitationFixture(
	overrides?: Partial<MyInvitation>,
): MyInvitation {
	return {
		id: 'inv-1',
		email: 'new@test.com',
		role: TEAM_ROLES.MEMBER,
		token: 'token-1',
		expiresAt: '2026-04-11T12:00:00.000Z',
		createdAt: '2026-04-09T12:00:00.000Z',
		team: {
			id: 'team-1',
			name: 'Dream Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
		},
		...overrides,
	}
}

export function createMyInvitationApiFixture(
	overrides?: Partial<MyInvitationApiResponse>,
): MyInvitationApiResponse {
	return {
		...createMyInvitationFixture(),
		...overrides,
	}
}

export function createDeleteTeamResponseFixture(
	overrides?: Partial<DeleteTeamResponse>,
): DeleteTeamResponse {
	return {
		message: 'Команда успешно удалена',
		success: true,
		...overrides,
	}
}
