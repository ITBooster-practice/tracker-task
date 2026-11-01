import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import {
	resetBoardHistoryMock,
	useBoardSearchParamsMock,
} from '@/test/mocks/views/boards/board-history.mock'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TaskFilterParams } from '@repo/types'

import { parseTaskFilters } from '@/views/tasks/model/use-task-filters'
import { ProjectTasksPageView } from '@/views/tasks/ui/project-tasks-page-view'
import type { TaskDetailsDialog } from '@/features/tasks'

const { push, tasks, retry, details } = vi.hoisted(() => ({
	push: vi.fn(),
	tasks: vi.fn(),
	retry: vi.fn(),
	details: { current: null as ComponentProps<typeof TaskDetailsDialog> | null },
}))
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
	useParams: () => ({ id: 'team-1', projectId: 'project-1' }),
	useSearchParams: () => useBoardSearchParamsMock(),
}))
vi.mock('@/shared/api/use-tasks', () => ({ useTasksList: tasks }))
vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMemberOptions: () => ({
		data: [{ userId: 'member-1', name: 'Участник', email: 'member@example.com' }],
		isPending: false,
		isError: false,
	}),
}))
vi.mock('@/shared/api/use-projects', () => ({
	useProjectDetail: () => ({ data: { name: 'Проект' } }),
}))
vi.mock('@/features/tasks', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/features/tasks')>()),
	TaskDetailsDialog: (props: ComponentProps<typeof TaskDetailsDialog>) => {
		details.current = props
		return (
			<section role='dialog' aria-label='Задача'>
				<button onClick={props.onClose}>Закрыть детали</button>
			</section>
		)
	},
}))

const result = (data: unknown[] = []) => ({
	data: { data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1 } },
	isLoading: false,
	isFetching: false,
	isError: false,
	refetch: retry,
})

async function select(label: string, option: string) {
	fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'ArrowDown' })
	fireEvent.click(await screen.findByRole('option', { name: option }))
}

describe('project task list', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resetBoardHistoryMock('/teams/team-1/projects/project-1/tasks?extra=keep')
		tasks.mockReturnValue(result())
		details.current = null
		Element.prototype.scrollIntoView = vi.fn()
		Element.prototype.hasPointerCapture = vi.fn(() => false)
		Element.prototype.setPointerCapture = vi.fn()
		Element.prototype.releasePointerCapture = vi.fn()
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn()
				unobserve = vi.fn()
				disconnect = vi.fn()
			},
		)
	})
	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})
	it('offers creation in the same project for an empty project', () => {
		render(<ProjectTasksPageView />)
		expect(
			screen.getByRole('heading', { name: 'В проекте пока нет задач', level: 2 }),
		).toBeDefined()
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
		fireEvent.click(screen.getByRole('button', { name: 'Создать первую задачу' }))
		expect(push).toHaveBeenCalledWith('/teams/team-1/projects/project-1/tasks/new')
	})
	it('renders task labels in the list and explains that search includes labels', () => {
		tasks.mockReturnValue(
			result([createTaskFixture({ labels: ['refactor', 'Frontend'] })]),
		)
		render(<ProjectTasksPageView />)
		expect(screen.getByText('refactor')).toBeDefined()
		expect(screen.getByText('Frontend')).toBeDefined()
		expect(screen.getByPlaceholderText('Поиск по названию, коду или метке')).toBe(
			screen.getByRole('textbox', { name: 'Поиск задач' }),
		)
	})
	it('sends all filters and sorting to the API, persists them in the URL and resets them', async () => {
		tasks.mockImplementation((_team, _project, params: TaskFilterParams) =>
			result(params.search ? [] : [createTaskFixture()]),
		)
		render(<ProjectTasksPageView />)
		fireEvent.change(screen.getByRole('textbox', { name: 'Поиск задач' }), {
			target: { value: '01234567-89ab-cdef-0123-456789abcdef' },
		})
		for (const [label, option] of [
			['Тип задачи', 'Баг'],
			['Статус задачи', 'Готово'],
			['Приоритет', 'Высокий'],
			['Исполнитель', 'Участник'],
			['Сортировка', 'Приоритет'],
			['Порядок', 'По возрастанию'],
		])
			await select(label!, option!)
		await waitFor(() =>
			expect(tasks).toHaveBeenLastCalledWith(
				'team-1',
				'project-1',
				expect.objectContaining({
					search: '01234567-89ab-cdef-0123-456789abcdef',
					type: 'BUG',
					status: 'DONE',
					priority: 'HIGH',
					assigneeId: 'member-1',
					sortBy: 'priority',
					sortOrder: 'asc',
					page: 1,
					limit: 20,
				}),
			),
		)
		expect(new URLSearchParams(window.location.search).get('sortBy')).toBe('priority')
		expect(screen.getByRole('heading', { name: 'Задачи не найдены' })).toBeDefined()
		expect(screen.queryByRole('button', { name: 'Создать первую задачу' })).toBeNull()
		fireEvent.click(screen.getAllByRole('button', { name: 'Сбросить фильтры' })[0]!)
		await waitFor(() => expect(screen.getByText(createTaskFixture().title)).toBeDefined())
		expect(window.location.search).toBe('?extra=keep')
		expect(screen.getByRole('textbox', { name: 'Поиск задач' })).toBe(
			document.activeElement,
		)
		expect(tasks).toHaveBeenLastCalledWith(
			'team-1',
			'project-1',
			expect.objectContaining({
				page: 1,
				sortBy: 'createdAt',
				sortOrder: 'desc',
				search: undefined,
			}),
		)
	})
	it('restores filters from a direct URL and keeps the task URL when opening and closing details', async () => {
		resetBoardHistoryMock(
			'/teams/team-1/projects/project-1/tasks?priority=HIGH&sortBy=status&sortOrder=asc&page=3&extra=keep',
		)
		tasks.mockReturnValue(result([createTaskFixture()]))
		render(<ProjectTasksPageView />)
		expect(screen.getByRole('combobox', { name: 'Приоритет' })).toHaveProperty(
			'textContent',
			'Высокий',
		)
		expect(tasks).toHaveBeenLastCalledWith(
			'team-1',
			'project-1',
			expect.objectContaining({
				page: 3,
				priority: 'HIGH',
				sortBy: 'status',
				sortOrder: 'asc',
			}),
		)
		fireEvent.click(screen.getByRole('link', { name: createTaskFixture().title }))
		expect(details.current).toMatchObject({
			teamId: 'team-1',
			projectId: 'project-1',
			taskId: 'task-1',
		})
		expect(new URLSearchParams(window.location.search).get('taskId')).toBe('task-1')
		fireEvent.click(screen.getByRole('button', { name: 'Закрыть детали' }))
		expect(window.location.search).toBe(
			'?priority=HIGH&sortBy=status&sortOrder=asc&page=3&extra=keep',
		)
		act(() => {
			window.history.replaceState(null, '', '?priority=HIGH&taskId=task-1&extra=keep')
			window.dispatchEvent(new PopStateEvent('popstate'))
		})
		expect(screen.getByRole('dialog', { name: 'Задача' })).toBeDefined()
	})
	it('restores details with Back and Forward while retaining filters', async () => {
		tasks.mockReturnValue(result([createTaskFixture()]))
		render(<ProjectTasksPageView />)
		await select('Приоритет', 'Высокий')
		fireEvent.click(screen.getByRole('link', { name: createTaskFixture().title }))
		expect(screen.getByRole('dialog')).toBeDefined()
		await act(async () => {
			const changed = new Promise<void>((resolve) =>
				window.addEventListener('popstate', () => resolve(), { once: true }),
			)
			window.history.back()
			await changed
		})
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(screen.getByRole('combobox', { name: 'Приоритет' })).toHaveProperty(
			'textContent',
			'Высокий',
		)
		await act(async () => {
			const changed = new Promise<void>((resolve) =>
				window.addEventListener('popstate', () => resolve(), { once: true }),
			)
			window.history.forward()
			await changed
		})
		expect(screen.getByRole('dialog')).toBeDefined()
		expect(new URLSearchParams(window.location.search).get('priority')).toBe('HIGH')
	})

	it.each([{ isLoading: true }, { isFetching: true }])(
		'keeps loading separate from empty results: %j',
		(flags) => {
			tasks.mockReturnValue({ ...result(), ...flags })
			render(<ProjectTasksPageView />)
			expect(
				screen.queryByRole('heading', { name: 'В проекте пока нет задач' }),
			).toBeNull()
		},
	)
	it('offers an API retry instead of an empty project', () => {
		tasks.mockReturnValue({ ...result(), isError: true })
		render(<ProjectTasksPageView />)
		expect(
			screen.getByRole('heading', { name: 'Не удалось загрузить задачи' }),
		).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		expect(retry).toHaveBeenCalledOnce()
	})
	it('normalizes invalid URL values independently without discarding valid filters', () => {
		expect(
			parseTaskFilters(
				new URLSearchParams('page=-3&limit=5000&priority=HIGH&type=bad&sortBy=oops'),
			),
		).toMatchObject({
			page: 1,
			limit: 20,
			priority: 'HIGH',
			type: undefined,
			sortBy: 'createdAt',
		})
	})
})
