import { vi, type MockedFunction } from 'vitest'

type ProjectsService = typeof import('@/shared/lib/api/projects-service').projectsService

type MockedProjectsService = {
	getAll: MockedFunction<ProjectsService['getAll']>
	getById: MockedFunction<ProjectsService['getById']>
	create: MockedFunction<ProjectsService['create']>
	update: MockedFunction<ProjectsService['update']>
	delete: MockedFunction<ProjectsService['delete']>
}

export const projectsServiceMock: MockedProjectsService = {
	getAll: vi.fn<ProjectsService['getAll']>(),
	getById: vi.fn<ProjectsService['getById']>(),
	create: vi.fn<ProjectsService['create']>(),
	update: vi.fn<ProjectsService['update']>(),
	delete: vi.fn<ProjectsService['delete']>(),
}

export function resetProjectsServiceMock() {
	for (const mockFn of Object.values(projectsServiceMock)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/projects-service', () => ({
	projectsService: projectsServiceMock,
}))
