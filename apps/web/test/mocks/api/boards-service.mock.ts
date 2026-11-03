import { vi } from 'vitest'

type BoardsService = typeof import('@/shared/lib/api/boards-service').boardsService

export const boardsServiceMock = {
	archive: vi.fn<BoardsService['archive']>(),
	getAll: vi.fn<BoardsService['getAll']>(),
	create: vi.fn<BoardsService['create']>(),
	update: vi.fn<BoardsService['update']>(),
	delete: vi.fn<BoardsService['delete']>(),
}

vi.mock('@/shared/lib/api/boards-service', () => ({ boardsService: boardsServiceMock }))
