import { vi } from 'vitest'

type Service = typeof import('@/shared/lib/api/board-columns-service').boardColumnsService

export const boardColumnsServiceMock = {
	create: vi.fn<Service['create']>(),
	update: vi.fn<Service['update']>(),
	delete: vi.fn<Service['delete']>(),
	reorder: vi.fn<Service['reorder']>(),
}

export function resetBoardColumnsServiceMock() {
	boardColumnsServiceMock.create.mockReset()
	boardColumnsServiceMock.update.mockReset()
	boardColumnsServiceMock.delete.mockReset()
	boardColumnsServiceMock.reorder.mockReset()
}

vi.mock('@/shared/lib/api/board-columns-service', () => ({
	boardColumnsService: boardColumnsServiceMock,
}))
