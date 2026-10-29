import {
	resetBoardHistoryMock,
	useBoardSearchParamsMock,
} from '@/test/mocks/views/boards/board-history.mock'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useProjectBoardFilters } from '@/views/boards/model/use-project-board-filters'

vi.mock('next/navigation', () => ({ useSearchParams: () => useBoardSearchParamsMock() }))
beforeEach(() =>
	resetBoardHistoryMock(
		'/teams/team-1/projects/project-1/board?boardId=other&extra=keep#tasks',
	),
)
afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

it('сохраняет режим отдельно от фильтров и восстанавливает его через URL', async () => {
	const { result } = renderHook(() => useProjectBoardFilters())
	act(() => {
		result.current.setGrouping('priority')
		result.current.update({ priority: 'HIGH' })
	})
	expect(result.current.grouping).toBe('priority')
	act(() => result.current.reset())
	expect(result.current.grouping).toBe('priority')
	expect(window.location.search).toContain('groupBy=priority')
	act(() => result.current.setGrouping('assignee'))
	act(() => window.history.back())
	await waitFor(() => expect(result.current.grouping).toBe('priority'))
	act(() => result.current.setGrouping('none'))
	expect(new URLSearchParams(window.location.search).has('groupBy')).toBe(false)
})
it('восстанавливает фильтры из URL и сохраняет boardId и другие параметры при быстрых изменениях', () => {
	const { result } = renderHook(() => useProjectBoardFilters())
	act(() => {
		result.current.update({ priority: 'HIGH' })
		result.current.update({ type: 'BUG' })
		result.current.update({ query: 'Тест' }, true)
	})
	expect(result.current.filters).toEqual({
		priority: 'HIGH',
		type: 'BUG',
		query: 'Тест',
		assignee: 'ALL',
	})
	expect(new URLSearchParams(window.location.search).get('boardId')).toBe('other')
	expect(new URLSearchParams(window.location.search).get('extra')).toBe('keep')
	expect(window.location.hash).toBe('#tasks')
})
it('поиск заменяет текущую запись, а выбор фильтра добавляет одну запись истории', () => {
	const { result } = renderHook(() => useProjectBoardFilters())
	const count = window.history.length
	act(() => result.current.update({ query: 'a' }, true))
	act(() => result.current.update({ query: 'ab' }, true))
	expect(window.history.length).toBe(count)
	act(() => result.current.update({ priority: 'LOW' }))
	expect(window.history.length).toBe(count + 1)
	act(() => result.current.reset())
	expect(result.current.filters.query).toBe('')
	expect(window.location.search).toBe('?boardId=other&extra=keep')
})
it('восстанавливает состояние через Назад/Вперёд, не записывая старый поиск поверх навигации', async () => {
	const { result } = renderHook(() => useProjectBoardFilters())
	act(() => result.current.update({ query: 'first' }, true))
	act(() => result.current.update({ priority: 'HIGH' }))
	act(() => result.current.update({ query: 'second' }, true))
	act(() => window.history.back())
	await waitFor(() =>
		expect(result.current.filters).toMatchObject({ query: 'first', priority: 'ALL' }),
	)
	act(() => window.history.forward())
	await waitFor(() =>
		expect(result.current.filters).toMatchObject({ query: 'second', priority: 'HIGH' }),
	)
})
