import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project } from '@repo/types'

import { ProjectCard } from '@/views/projects/ui/project-card'

vi.mock('@repo/ui/icons', () => ({
	ArrowRight: () => <span data-testid='arrow-icon' />,
	FolderKanban: () => <span data-testid='folder-icon' />,
}))

vi.mock('@repo/ui', () => ({
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

const createProject = (overrides?: Partial<Project>): Project => ({
	id: 'proj-1',
	name: 'Test Project',
	description: 'Описание проекта для тестов',
	teamId: 'team-1',
	createdById: 'user-1',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
	...overrides,
})

describe('ProjectCard', () => {
	let onOpen: ReturnType<typeof vi.fn<(project: Project) => void>>

	beforeEach(() => {
		onOpen = vi.fn()
	})

	afterEach(cleanup)

	it('отображает код (первые 2 буквы названия), название и описание', () => {
		render(<ProjectCard project={createProject()} onOpen={onOpen} />)

		expect(screen.getByText('TE')).toBeDefined()
		expect(screen.getByText('Test Project')).toBeDefined()
		expect(screen.getByText('Описание проекта для тестов')).toBeDefined()
	})

	it('показывает "Нет описания" когда description равен null', () => {
		render(<ProjectCard project={createProject({ description: null })} onOpen={onOpen} />)

		expect(screen.getByText(/Нет описания/)).toBeDefined()
	})

	it('клик вызывает onOpen с данными проекта', () => {
		render(<ProjectCard project={createProject()} onOpen={onOpen} />)
		fireEvent.click(screen.getByRole('button'))

		expect(onOpen).toHaveBeenCalledOnce()
		expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'proj-1' }))
	})
})
