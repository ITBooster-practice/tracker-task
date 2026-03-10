import { vi } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'

export function createPrismaMock() {
	return {
		team: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		teamMember: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
		},
	} as unknown as PrismaService & {
		team: {
			create: ReturnType<typeof vi.fn>
			findUnique: ReturnType<typeof vi.fn>
			update: ReturnType<typeof vi.fn>
			delete: ReturnType<typeof vi.fn>
		}
		teamMember: {
			findUnique: ReturnType<typeof vi.fn>
			findMany: ReturnType<typeof vi.fn>
		}
	}
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const USER_ID = 'user-id-1'
export const TEAM_ID = 'team-id-1'

export const MEMBER_OWNER = {
	id: 'member-id-1',
	teamId: TEAM_ID,
	userId: USER_ID,
	role: 'OWNER' as const,
	joinedAt: new Date(),
}

export const MEMBER_ADMIN = {
	id: 'member-id-2',
	teamId: TEAM_ID,
	userId: 'user-id-2',
	role: 'ADMIN' as const,
	joinedAt: new Date(),
}

export const MEMBER_PLAIN = {
	id: 'member-id-3',
	teamId: TEAM_ID,
	userId: 'user-id-3',
	role: 'MEMBER' as const,
	joinedAt: new Date(),
}

export const TEAM = {
	id: TEAM_ID,
	name: 'Dream Team',
	description: null,
	avatarUrl: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	members: [
		{
			...MEMBER_OWNER,
			user: { id: USER_ID, name: 'Alice', email: 'alice@example.com' },
		},
	],
}
