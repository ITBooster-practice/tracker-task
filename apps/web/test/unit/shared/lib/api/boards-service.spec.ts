import '@/test/mocks/api/http-client.mock'

import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import { axiosResponse } from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, expect, it } from 'vitest'

import { boardsService } from '@/shared/lib/api/boards-service'

beforeEach(resetApiClientMock)

it('загружает массив досок проекта с колонками и передаёт отмену запроса', async () => {
	const boards = [createBoardListItemFixture({ isDefault: true })]
	const { signal } = new AbortController()
	mockApiClient.get.mockResolvedValue(axiosResponse(boards))
	await expect(boardsService.getAll('team-1', 'project-1', signal)).resolves.toEqual(
		boards,
	)
	expect(mockApiClient.get).toHaveBeenCalledExactlyOnceWith(
		'/teams/team-1/projects/project-1/boards',
		{ signal },
	)
})

it('создаёт доску по контракту имени и возвращает её со счётчиком', async () => {
	const board = createBoardListItemFixture({ taskCount: 0 })
	mockApiClient.post.mockResolvedValue(axiosResponse(board))
	await expect(
		boardsService.create('team-1', 'project-1', { name: 'Поддержка' }),
	).resolves.toEqual(board)
	expect(mockApiClient.post).toHaveBeenCalledExactlyOnceWith(
		'/teams/team-1/projects/project-1/boards',
		{ name: 'Поддержка' },
	)
})

it('архивирует доску с версией сохранённых настроек', async () => {
	mockApiClient.post.mockResolvedValue(axiosResponse(undefined))
	const data = { expectedUpdatedAt: '2026-11-03T12:00:00.000Z' }
	await expect(
		boardsService.archive('team-1', 'project-1', 'board-1', data),
	).resolves.toBeUndefined()
	expect(mockApiClient.post).toHaveBeenCalledExactlyOnceWith(
		'/teams/team-1/projects/project-1/boards/board-1/archive',
		data,
	)
})
