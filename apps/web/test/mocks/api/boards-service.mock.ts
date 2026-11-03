import { vi } from 'vitest'

type BoardsService = typeof import('@/shared/lib/api/boards-service').boardsService

export const boardsServiceMock = {
	archive: vi.fn<BoardsService['archive']>(),
	getAll: vi.fn<BoardsService['getAll']>(),
	create: vi.fn<BoardsService['create']>(),
	update: vi.fn<BoardsService['update']>(),
}

vi.mock('@/shared/lib/api/boards-service', () => ({ boardsService: boardsServiceMock }))
