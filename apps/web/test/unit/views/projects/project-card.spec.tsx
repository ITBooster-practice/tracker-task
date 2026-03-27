import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectCard } from '@/views/projects/ui/project-card'
import type { ProjectCatalogItem } from '@/shared/lib/projects'

vi.mock('@repo/ui/icons', () => ({
	ArrowRight: () => <span data-testid='arrow-icon' />,
	KanbanSquare: () => <span data-testid='kanban-icon' />,
	ListTodo: () => <span data-testid='todo-icon' />,
}))

vi.mock('@repo/ui', () => ({
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

const createProject = (overrides?: Partial<ProjectCatalogItem>): ProjectCatalogItem => ({
	id: 'proj-1',
	code: 'PRJ',
	name: 'Test Project',
	description: 'Описание проекта для тестов',
	boardsCount: 2,
	tasksCount: 15,
	boards: [],
	recentTasks: [],
	...overrides,
})

describe('ProjectCard', () => {
	let onOpen: ReturnType<typeof vi.fn<(project: ProjectCatalogItem) => void>>

	beforeEach(() => {
		onOpen = vi.fn()
	})

	afterEach(cleanup)

	it('отображает код, название и описание проекта', () => {
		render(<ProjectCard project={createProject()} onOpen={onOpen} />)

		expect(screen.getByText('PRJ')).toBeDefined()
		expect(screen.getByText('Test Project')).toBeDefined()
		expect(screen.getByText('Описание проекта для тестов')).toBeDefined()
	})

	it('отображает количество досок и задач', () => {
		render(<ProjectCard project={createProject()} onOpen={onOpen} />)

		expect(screen.getByText(/2 досок/)).toBeDefined()
		expect(screen.getByText(/15 задач/)).toBeDefined()
	})

	it('клик вызывает onOpen с данными проекта', () => {
		render(<ProjectCard project={createProject()} onOpen={onOpen} />)
		fireEvent.click(screen.getByRole('button'))

		expect(onOpen).toHaveBeenCalledOnce()
		expect(onOpen).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'proj-1', code: 'PRJ' }),
		)
	})
})
