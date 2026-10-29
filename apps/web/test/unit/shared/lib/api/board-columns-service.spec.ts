import '@/test/mocks/api/http-client.mock'

import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import { axiosResponse } from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, expect, it } from 'vitest'

import { boardColumnsService } from '@/shared/lib/api/board-columns-service'

beforeEach(resetApiClientMock)

it('передаёт колонку назначения в теле DELETE и принимает пустой ответ', async () => {
	mockApiClient.delete.mockResolvedValue(axiosResponse(undefined))
	await expect(
		boardColumnsService.delete('board-1', 'source', { targetColumnId: 'target' }),
	).resolves.toBeUndefined()
	expect(mockApiClient.delete).toHaveBeenCalledExactlyOnceWith(
		'/boards/board-1/columns/source',
		{ data: { targetColumnId: 'target' } },
	)
})

it('передаёт полный порядок колонок в PATCH reorder', async () => {
	const columns = createBoardListItemFixture().columns
	mockApiClient.patch.mockResolvedValue(axiosResponse(columns))
	await expect(
		boardColumnsService.reorder('board-1', { columnIds: ['second', 'first'] }),
	).resolves.toEqual(columns)
	expect(mockApiClient.patch).toHaveBeenCalledExactlyOnceWith(
		'/boards/board-1/columns/reorder',
		{ columnIds: ['second', 'first'] },
	)
})

it('создаёт колонку в выбранной доске с обязательным ключом и названием', async () => {
	const column = createBoardListItemFixture().columns[0]!
	const data = { key: 'column_key', title: 'Проверка' }
	mockApiClient.post.mockResolvedValue(axiosResponse(column))
	await expect(boardColumnsService.create('board-1', data)).resolves.toEqual(column)
	expect(mockApiClient.post).toHaveBeenCalledExactlyOnceWith(
		'/boards/board-1/columns',
		data,
	)
})

it('переименовывает колонку, сохраняя её ключ и позицию', async () => {
	const column = createBoardListItemFixture().columns[0]!
	mockApiClient.patch.mockResolvedValue(axiosResponse(column))
	await expect(
		boardColumnsService.update('board-1', 'column-1', {
			title: 'Готово к выпуску',
		}),
	).resolves.toEqual(column)
	expect(mockApiClient.patch).toHaveBeenCalledExactlyOnceWith(
		'/boards/board-1/columns/column-1',
		{ title: 'Готово к выпуску' },
	)
})
