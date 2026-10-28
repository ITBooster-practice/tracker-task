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
