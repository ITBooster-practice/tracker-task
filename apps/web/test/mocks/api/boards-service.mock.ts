import { vi } from 'vitest'

type BoardsService = typeof import('@/shared/lib/api/boards-service').boardsService

export const boardsServiceMock = { getAll: vi.fn<BoardsService['getAll']>() }

vi.mock('@/shared/lib/api/boards-service', () => ({ boardsService: boardsServiceMock }))
