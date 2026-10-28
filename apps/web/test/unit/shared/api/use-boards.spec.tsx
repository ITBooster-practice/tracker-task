import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'

import { useBoardsList } from '@/shared/api/use-boards'

beforeEach(() => {
	boardsServiceMock.getAll.mockReset()
})
afterEach(cleanup)

it.each([
	['', 'project-1'],
	['team-1', ''],
])('не загружает список досок без контекста (%s, %s)', (teamId, projectId) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)
	const { result, unmount } = renderHook(() => useBoardsList(teamId, projectId), {
		wrapper: Wrapper,
	})
	expect(result.current.fetchStatus).toBe('idle')
	expect(boardsServiceMock.getAll).not.toHaveBeenCalled()
	unmount()
	client.clear()
})
