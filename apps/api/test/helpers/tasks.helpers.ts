import { vi } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { TEAM_ID, USER_ID } from './teams.helpers'

export { TEAM_ID, USER_ID }

export function createPrismaMock() {
	const prisma = {
		teamMember: {
			findUnique: vi.fn(),
		},
		project: {
			findUnique: vi.fn(),
		},
		boardColumn: {
			findFirst: vi.fn().mockImplementation(({ where }) => ({
				id:
					where.id ??
					(where.key && where.key !== 'TODO'
						? `${where.key.toLowerCase()}-column-id`
						: 'system-column-id'),
				boardId: where.boardId ?? 'main-board-id',
				projectId: PROJECT_ID,
				key: where.key ?? 'TODO',
				isSystem: true,
			})),
			findFirstOrThrow: vi
				.fn()
				.mockResolvedValue({ id: 'system-column-id', isSystem: true }),
		},
		task: {
			aggregate: vi.fn(),
			create: vi.fn().mockResolvedValue(MOCK_TASK),
			findMany: vi.fn(),
			findUnique: vi.fn(),
			count: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		taskLabel: {
			createMany: vi.fn(),
			findMany: vi.fn().mockResolvedValue([]),
		},
		$queryRaw: vi
			.fn()
			.mockImplementation((query) =>
				query.strings.join('').includes('FROM "Task"')
					? [MOCK_TASK]
					: [{ id: 'main-board-id' }],
			),
		$executeRaw: vi.fn().mockResolvedValue(1),
		$transaction: vi.fn(),
	}
	prisma.$transaction.mockImplementation((callback) => callback(prisma))
	return prisma as unknown as PrismaService & {
		$queryRaw: ReturnType<typeof vi.fn>
		$executeRaw: ReturnType<typeof vi.fn>
		$transaction: ReturnType<typeof vi.fn>
		teamMember: {
			findUnique: ReturnType<typeof vi.fn>
		}
		project: {
			findUnique: ReturnType<typeof vi.fn>
		}
		taskLabel: {
			createMany: ReturnType<typeof vi.fn>
			findMany: ReturnType<typeof vi.fn>
		}
		boardColumn: {
			findFirst: ReturnType<typeof vi.fn>
			findFirstOrThrow: ReturnType<typeof vi.fn>
		}
		task: {
			aggregate: ReturnType<typeof vi.fn>
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
export const TASK_ID = 'task-id-1'
export const OTHER_USER_ID = 'other-user-id'

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
	userId: 'admin-user-id',
	role: 'ADMIN' as const,
	joinedAt: new Date(),
}

export const MEMBER_PLAIN = {
	id: 'member-id-3',
	teamId: TEAM_ID,
	userId: OTHER_USER_ID,
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

const MOCK_TASK_FIELDS = {
	id: TASK_ID,
	title: 'Fix login bug',
	description: null,
	status: 'TODO' as const,
	priority: 'MEDIUM' as const,
	type: 'TASK' as const,
	position: 1,
	version: 0,
	dueDate: null,
	projectId: PROJECT_ID,
	boardColumnId: 'system-column-id',
	assigneeId: null,
	createdById: USER_ID,
	createdAt: new Date(),
	updatedAt: new Date(),
}

export const MOCK_TASK = { ...MOCK_TASK_FIELDS, labelAssignments: [] }
export const MOCK_TASK_RESPONSE = { ...MOCK_TASK_FIELDS, labels: [] }

export const CREATE_TASK_DTO = {
	title: 'Fix login bug',
}

export const UPDATE_TASK_DTO = {
	title: 'Updated title',
}
