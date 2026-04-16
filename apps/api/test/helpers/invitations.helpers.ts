import { vi } from 'vitest'

import { PrismaService } from '../../prisma/prisma.service'
import { MailService } from '../../src/mail/mail.service'
import { TEAM_ID, USER_ID } from './teams.helpers'

type MockFn = ReturnType<typeof vi.fn>

type InvitationsPrismaTransactionMock = {
	teamMember: {
		create: MockFn
	}
	teamInvitation: {
		update: MockFn
	}
	team: {
		findUnique: MockFn
	}
}

export type InvitationsPrismaMock = PrismaService & {
	team: { findUnique: MockFn }
	teamMember: {
		findUnique: MockFn
		create: MockFn
	}
	teamInvitation: {
		findFirst: MockFn
		findUnique: MockFn
		findMany: MockFn
		count: MockFn
		create: MockFn
		update: MockFn
		updateMany: MockFn
	}
	user: { findUnique: MockFn }
	$transaction: MockFn
	transaction: InvitationsPrismaTransactionMock
}

export type InvitationMailMock = MailService & {
	sendTeamInvitationEmail: MockFn
}

export const INVITATION_ID = 'invitation-id-1'
export const INVITATION_TOKEN = '550e8400-e29b-41d4-a716-446655440000'
export const INVITED_EMAIL = 'invitee@example.com'
export const INVITER_ID = USER_ID
const PENDING_INVITATION_EXPIRES_IN_MS = 24 * 60 * 60 * 1000
export const INVITER = {
	id: INVITER_ID,
	teamId: TEAM_ID,
	userId: INVITER_ID,
	role: 'OWNER' as const,
	joinedAt: new Date('2026-04-09T10:00:00.000Z'),
	user: {
		id: INVITER_ID,
		name: 'Alice',
		email: 'owner@example.com',
	},
}

export const TEAM = {
	id: TEAM_ID,
	name: 'Dream Team',
	description: null,
	avatarUrl: null,
	createdAt: new Date('2026-04-09T10:00:00.000Z'),
	updatedAt: new Date('2026-04-09T10:00:00.000Z'),
}

export const TEAM_WITH_MEMBERS = {
	...TEAM,
	members: [
		{
			id: 'member-id-1',
			teamId: TEAM_ID,
			userId: INVITER_ID,
			role: 'OWNER' as const,
			joinedAt: new Date('2026-04-09T10:00:00.000Z'),
			user: INVITER.user,
		},
	],
}

export const PENDING_INVITATION = {
	id: INVITATION_ID,
	teamId: TEAM_ID,
	invitedById: INVITER_ID,
	email: INVITED_EMAIL,
	role: 'MEMBER' as const,
	status: 'PENDING' as const,
	token: INVITATION_TOKEN,
	expiresAt: new Date(Date.now() + PENDING_INVITATION_EXPIRES_IN_MS),
	createdAt: new Date('2026-04-09T10:00:00.000Z'),
	updatedAt: new Date('2026-04-09T10:00:00.000Z'),
	team: {
		id: TEAM_ID,
		name: TEAM.name,
		description: TEAM.description,
		avatarUrl: TEAM.avatarUrl,
	},
	invitedBy: INVITER.user,
}

export function createInvitationsPrismaMock(): InvitationsPrismaMock {
	const transaction: InvitationsPrismaTransactionMock = {
		teamMember: {
			create: vi.fn(),
		},
		teamInvitation: {
			update: vi.fn(),
		},
		team: {
			findUnique: vi.fn(),
		},
	}

	const prisma = {
		team: {
			findUnique: vi.fn(),
		},
		teamMember: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		teamInvitation: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) =>
			callback(transaction),
		),
		transaction,
	} as unknown as InvitationsPrismaMock

	return prisma
}

export function createInvitationMailMock(): InvitationMailMock {
	return {
		sendTeamInvitationEmail: vi.fn().mockResolvedValue(undefined),
	} as unknown as InvitationMailMock
}
