import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTaskDialog } from '@/views/tasks/ui/create-task-dialog'
import { TaskCreateDialog } from '@/features/tasks'

const { replace, back, create, success, error } = vi.hoisted(() => ({
	replace: vi.fn(),
	back: vi.fn(),
	create: vi.fn(),
	success: vi.fn(),
	error: vi.fn(),
}))
vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace, back }),
	useParams: () => ({ id: 'team-1', projectId: 'project-1' }),
}))
vi.mock('@repo/ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@repo/ui')>()),
	toast: { success, error },
}))
vi.mock('@/shared/api/use-tasks', () => ({
	useCreateTask: () => ({ mutateAsync: create, isPending: false }),
}))
vi.mock('@/shared/api/use-task-labels', () => ({
	useTaskLabels: () => ({
		data: ['refactor'],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
	}),
}))
vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMemberOptions: () => ({
		data: [{ userId: 'user-1', name: 'Иван Иванов' }],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
	}),
}))

let width: number
const listeners = new Set<() => void>()
function resize(nextWidth: number) {
	act(() => {
		width = nextWidth
		listeners.forEach((listener) => listener())
	})
}
function title(value = 'Новая задача') {
	fireEvent.change(screen.getByLabelText('Название'), { target: { value } })
}
async function select(label: string, option: string) {
	const group = await screen.findByRole('radiogroup', { name: label })
	fireEvent.click(within(group).getByRole('radio', { name: option }))
}

describe('task creation', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		width = 1280
		listeners.clear()
		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => ({
				matches: width >= Number(query.match(/min-width:\s*(\d+)/)?.[1] ?? Infinity),
				media: query,
				addEventListener: (_: string, listener: () => void) => listeners.add(listener),
				removeEventListener: (_: string, listener: () => void) =>
					listeners.delete(listener),
			})),
		)
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

	it.each([375, 768, 1024, 1279, 1280, 1440])(
		'chooses a single shell at %i px',
		(viewport) => {
			width = viewport
			render(<CreateTaskDialog />)
			expect(screen.getAllByRole('dialog')).toHaveLength(1)
			expect(document.querySelector('[data-slot="dialog-content"]') !== null).toBe(
				viewport >= 1280,
			)
			expect(document.querySelector('[data-slot="sheet-content"]') !== null).toBe(
				viewport < 1280,
			)
		},
	)
	it('keeps every entered value when resizing and sends the common payload', async () => {
		create.mockResolvedValue({})
		render(<CreateTaskDialog />)
		title('  Первая задача  ')
		fireEvent.change(screen.getByLabelText('Описание'), {
			target: { value: '  Контекст  ' },
		})
		fireEvent.change(screen.getByLabelText('Срок'), { target: { value: '20.11.2026' } })
		await select('Исполнитель', 'Иван Иванов')
		await select('Тип задачи', 'Баг')
		await select('Приоритет', 'Высокий')
		await select('Статус', 'В работе')
		fireEvent.click(screen.getByRole('button', { name: 'Добавить метку «refactor»' }))
		fireEvent.change(screen.getByLabelText('Метки'), {
			target: { value: '  Frontend  ' },
		})
		fireEvent.keyDown(screen.getByLabelText('Метки'), { key: 'Enter' })
		resize(768)
		expect(screen.getByLabelText('Название')).toHaveProperty('value', 'Первая задача')
		expect(screen.getByLabelText('Описание')).toHaveProperty('value', 'Контекст')
		expect(screen.getByLabelText('Срок')).toHaveProperty('value', '20.11.2026')
		expect(
			screen.getByRole('radio', { name: 'Иван Иванов', checked: true }),
		).toBeDefined()
		resize(1440)
		expect(screen.getByRole('button', { name: 'Снять метку «refactor»' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Снять метку «Frontend»' })).toBeDefined()
		expect(create).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		await waitFor(() => expect(create).toHaveBeenCalledOnce())
		expect(create).toHaveBeenCalledWith({
			teamId: 'team-1',
			projectId: 'project-1',
			data: {
				title: 'Первая задача',
				description: 'Контекст',
				labels: ['refactor', 'Frontend'],
				type: 'BUG',
				priority: 'HIGH',
				status: 'IN_PROGRESS',
				assigneeId: 'user-1',
				dueDate: '2026-11-20T00:00:00.000Z',
			},
		})
		await waitFor(() =>
			expect(replace).toHaveBeenCalledWith('/teams/team-1/projects/project-1/tasks'),
		)
	})
	it('keeps the draft on an API error and retries without duplicate requests', async () => {
		let reject!: (reason: unknown) => void
		create
			.mockReturnValueOnce(
				new Promise((_, fail) => {
					reject = fail
				}),
			)
			.mockResolvedValue({})
		render(<CreateTaskDialog intercepted />)
		title('Черновик')
		const form = screen.getByLabelText('Название').closest('form')!
		fireEvent.submit(form)
		fireEvent.submit(form)
		await waitFor(() => expect(create).toHaveBeenCalledOnce())
		fireEvent.keyDown(document, { key: 'Escape' })
		expect(back).not.toHaveBeenCalled()
		await act(async () => reject({ statusCode: 403, message: 'Недостаточно прав' }))
		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Недостаточно прав',
		)
		expect(screen.getByLabelText('Название')).toHaveProperty('value', 'Черновик')
		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
		await waitFor(() => expect(back).toHaveBeenCalledOnce())
	})
	it.each([375, 1280])(
		'uses the shared calendar and column mapping at %i px',
		async (viewport) => {
			width = viewport
			create.mockResolvedValue({})
			const onClose = vi.fn()
			render(
				<TaskCreateDialog
					teamId='team-1'
					projectId='project-1'
					boardName='Разработка'
					initialColumnId='review'
					columns={[
						{ id: 'todo', key: 'TODO', title: 'Очередь' },
						{ id: 'review', key: 'IN_REVIEW', title: 'Проверка' },
					]}
					onClose={onClose}
				/>,
			)
			expect(
				within(screen.getByRole('radiogroup', { name: 'Колонка' })).getByRole('radio', {
					name: 'Проверка',
					checked: true,
				}),
			).toBeDefined()
			title()
			fireEvent.change(screen.getByLabelText('Срок'), { target: { value: '20.11.2026' } })
			fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }))
			fireEvent.click(await screen.findByRole('button', { name: /21 ноября 2026/ }))
			expect(screen.getByLabelText('Срок')).toHaveProperty('value', '21.11.2026')
			expect(screen.getAllByRole('dialog')).toHaveLength(1)
			await waitFor(() =>
				expect(screen.getByRole('button', { name: 'Создать задачу' })).toHaveProperty(
					'disabled',
					false,
				),
			)
			fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
			await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
			expect(create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						status: 'IN_REVIEW',
						boardColumnId: 'review',
						dueDate: '2026-11-21T00:00:00.000Z',
					}),
				}),
			)
		},
	)
	it('creates in a custom column whose key is not a task status', async () => {
		create.mockResolvedValue({})
		const onClose = vi.fn()
		render(
			<TaskCreateDialog
				teamId='team-1'
				projectId='project-1'
				initialColumnId='qa'
				columns={[
					{ id: 'todo', key: 'TODO', title: 'Очередь' },
					{ id: 'qa', key: 'qa_lane', title: 'Проверка качества' },
				]}
				onClose={onClose}
			/>,
		)
		expect(
			screen.getByRole('radio', { name: 'Проверка качества', checked: true }),
		).toBeDefined()
		title('Проверить оплату')
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ boardColumnId: 'qa', status: 'TODO' }),
			}),
		)
	})
	it('changes the actual target column and corresponding task status', async () => {
		create.mockResolvedValue({})
		render(
			<TaskCreateDialog
				teamId='team-1'
				projectId='project-1'
				columns={[
					{ id: 'todo', key: 'TODO', title: 'Очередь' },
					{ id: 'review', key: 'IN_REVIEW', title: 'Проверка' },
				]}
				onClose={vi.fn()}
			/>,
		)
		title()
		fireEvent.click(screen.getByRole('radio', { name: 'Проверка' }))
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await waitFor(() => expect(create).toHaveBeenCalledOnce())
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ boardColumnId: 'review', status: 'IN_REVIEW' }),
			}),
		)
	})
	it('does not create a task on cancel and returns to the intercepted context', () => {
		render(<CreateTaskDialog intercepted />)
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(back).toHaveBeenCalledOnce()
		expect(create).not.toHaveBeenCalled()
	})
	it('closes on Escape and restores focus to the opener', async () => {
		const opener = document.createElement('button')
		document.body.append(opener)
		opener.focus()
		const { unmount } = render(<CreateTaskDialog />)
		fireEvent.keyDown(document, { key: 'Escape' })
		expect(replace).toHaveBeenCalledWith('/teams/team-1/projects/project-1/tasks')
		unmount()
		await waitFor(() => expect(document.activeElement).toBe(opener))
		opener.remove()
	})
	it('rejects whitespace-only titles using the shared schema', async () => {
		render(<CreateTaskDialog />)
		title('   ')
		fireEvent.submit(screen.getByLabelText('Название').closest('form')!)
		await screen.findByRole('alert')
		expect(create).not.toHaveBeenCalled()
	})
	it('hydrates directly into the correct shell without a recoverable error', async () => {
		const view = <CreateTaskDialog />
		const container = document.createElement('div')
		container.innerHTML = renderToString(view)
		expect(container.innerHTML).toBe('')
		document.body.append(container)
		const recoverableError = vi.fn()
		let root!: ReturnType<typeof hydrateRoot>
		await act(async () => {
			root = hydrateRoot(container, view, { onRecoverableError: recoverableError })
		})
		expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
		expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull()
		expect(recoverableError).not.toHaveBeenCalled()
		await act(async () => root.unmount())
		container.remove()
	})
})
