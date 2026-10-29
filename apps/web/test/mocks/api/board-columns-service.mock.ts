import { vi } from 'vitest'

type Service = typeof import('@/shared/lib/api/board-columns-service').boardColumnsService

export const boardColumnsServiceMock = {
	create: vi.fn<Service['create']>(),
	update: vi.fn<Service['update']>(),
}

export function resetBoardColumnsServiceMock() {
	boardColumnsServiceMock.create.mockReset()
	boardColumnsServiceMock.update.mockReset()
}

vi.mock('@/shared/lib/api/board-columns-service', () => ({
	boardColumnsService: boardColumnsServiceMock,
}))
