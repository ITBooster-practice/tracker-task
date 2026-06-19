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
			findUnique: vi.fn(),
		},
		task: {
			aggregate: vi.fn(),
			create: vi.fn(),
		},
	} as unknown as PrismaService & {
		teamMember: {
			findUnique: ReturnType<typeof vi.fn>
		}
		project: {
			findUnique: ReturnType<typeof vi.fn>
		}
		task: {
			aggregate: ReturnType<typeof vi.fn>
			create: ReturnType<typeof vi.fn>
		}
	}
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const PROJECT_ID = 'project-id-1'
export const TASK_ID = 'task-id-1'

export const MEMBER_OWNER = {
	id: 'member-id-1',
	teamId: TEAM_ID,
	userId: USER_ID,
	role: 'OWNER' as const,
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

export const MOCK_TASK = {
	id: TASK_ID,
	title: 'Fix login bug',
	description: null,
	status: 'TODO' as const,
	priority: 'MEDIUM' as const,
	position: 1,
	dueDate: null,
	projectId: PROJECT_ID,
	assigneeId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
}

export const CREATE_TASK_DTO = {
	title: 'Fix login bug',
}
