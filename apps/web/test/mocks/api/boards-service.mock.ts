import { vi } from 'vitest'

type BoardsService = typeof import('@/shared/lib/api/boards-service').boardsService

export const boardsServiceMock = {
	getAll: vi.fn<BoardsService['getAll']>(),
	create: vi.fn<BoardsService['create']>(),
	delete: vi.fn<BoardsService['delete']>(),
}

vi.mock('@/shared/lib/api/boards-service', () => ({ boardsService: boardsServiceMock }))
