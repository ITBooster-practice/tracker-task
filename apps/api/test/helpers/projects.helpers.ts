import { vi } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { TEAM_ID, USER_ID } from './teams.helpers'

export { TEAM_ID, USER_ID }

export function createPrismaMock() {
	return {
		teamMember: {
			findUnique: vi.fn(),
		},
		project: {
			create: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn(),
			count: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	} as unknown as PrismaService & {
		teamMember: {
			findUnique: ReturnType<typeof vi.fn>
		}
		project: {
			create: ReturnType<typeof vi.fn>
			findMany: ReturnType<typeof vi.fn>
			findUnique: ReturnType<typeof vi.fn>
			count: ReturnType<typeof vi.fn>
			update: ReturnType<typeof vi.fn>
			delete: ReturnType<typeof vi.fn>
		}
	}
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const PROJECT_ID = 'project-id-1'

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
	userId: 'user-id-admin',
	role: 'ADMIN' as const,
	joinedAt: new Date(),
}

export const MEMBER_PLAIN = {
	id: 'member-id-3',
	teamId: TEAM_ID,
	userId: 'user-id-plain',
	role: 'MEMBER' as const,
	joinedAt: new Date(),
}

export const MOCK_PROJECT = {
	id: PROJECT_ID,
	name: 'Backend Rewrite',
	description: null,
	teamId: TEAM_ID,
	createdById: USER_ID,
	createdAt: new Date(),
	updatedAt: new Date(),
}
