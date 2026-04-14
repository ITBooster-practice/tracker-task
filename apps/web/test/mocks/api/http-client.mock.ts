import { vi, type MockedFunction } from 'vitest'

type ApiClient = typeof import('@/shared/lib/api/client').client

type MockedApiClient = {
	get: MockedFunction<ApiClient['get']>
	post: MockedFunction<ApiClient['post']>
	patch: MockedFunction<ApiClient['patch']>
	delete: MockedFunction<ApiClient['delete']>
}

export const mockApiClient: MockedApiClient = {
	get: vi.fn<ApiClient['get']>(),
	post: vi.fn<ApiClient['post']>(),
	patch: vi.fn<ApiClient['patch']>(),
	delete: vi.fn<ApiClient['delete']>(),
}

export function resetApiClientMock() {
	for (const mockFn of Object.values(mockApiClient)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/client', () => ({
	client: mockApiClient,
}))
