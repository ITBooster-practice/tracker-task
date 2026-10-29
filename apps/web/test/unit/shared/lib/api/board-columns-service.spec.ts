import '@/test/mocks/api/http-client.mock'

import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import { axiosResponse } from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, expect, it } from 'vitest'

import { boardColumnsService } from '@/shared/lib/api/board-columns-service'

beforeEach(resetApiClientMock)

it('создаёт колонку в выбранной доске с обязательным ключом и названием', async () => {
	const column = createBoardListItemFixture().columns[0]!
	const data = { key: 'column_key', title: 'Проверка' }
	mockApiClient.post.mockResolvedValue(axiosResponse(column))
	await expect(
		boardColumnsService.create('team-1', 'project-1', 'board-1', data),
	).resolves.toEqual(column)
	expect(mockApiClient.post).toHaveBeenCalledExactlyOnceWith(
		'/teams/team-1/projects/project-1/boards/board-1/columns',
		data,
	)
})

it('переименовывает колонку, сохраняя её ключ и позицию', async () => {
	const column = createBoardListItemFixture().columns[0]!
	mockApiClient.patch.mockResolvedValue(axiosResponse(column))
	await expect(
		boardColumnsService.update('team-1', 'project-1', 'board-1', 'column-1', {
			title: 'Готово к выпуску',
		}),
	).resolves.toEqual(column)
	expect(mockApiClient.patch).toHaveBeenCalledExactlyOnceWith(
		'/teams/team-1/projects/project-1/boards/board-1/columns/column-1',
		{ title: 'Готово к выпуску' },
	)
})
