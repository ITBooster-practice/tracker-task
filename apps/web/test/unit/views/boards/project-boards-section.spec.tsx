import '@/test/mocks/views/boards/project-boards-ui.mock'
import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem } from '@repo/types'

import { ProjectBoardsSection } from '@/views/boards/ui/project-boards-section'
import { boardsKeys } from '@/shared/api/use-boards'

const { push, featureEnabled } = vi.hoisted(() => ({
	push: vi.fn(),
	featureEnabled: { value: true },
}))
vi.mock('@/shared/lib/feature-flags/context', () => ({
	useFeature: () => featureEnabled.value,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/link', () => ({
	default: ({
		children,
		...props
	}: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
		<a {...props}>{children}</a>
	),
}))

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}

const main = createBoardListItemFixture({
	name: 'Основная доска',
	isDefault: true,
	taskCount: 3,
})
const extra = createBoardListItemFixture({
	id: 'board /2',
	name: 'Поддержка',
	taskCount: 0,
})
let client: QueryClient
const Wrapper = ({ children }: React.PropsWithChildren) => (
	<QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
	push.mockReset()
	featureEnabled.value = true
	Object.values(boardsServiceMock).forEach((mock) => mock.mockReset())
	boardsServiceMock.getAll.mockResolvedValue([main, extra])
	client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, staleTime: Infinity },
			mutations: { retry: false },
		},
	})
	vi.stubGlobal('matchMedia', () => ({
		matches: true,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}))
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	)
})
afterEach(() => {
	cleanup()
	client.clear()
	vi.unstubAllGlobals()
})

const renderSection = () =>
	render(<ProjectBoardsSection teamId='team-1' projectId='project-1' />, {
		wrapper: Wrapper,
	})

describe('ProjectBoardsSection', () => {
	it('не запрашивает доски недоступного раздела', () => {
		featureEnabled.value = false
		renderSection()
		expect(screen.queryByRole('heading', { name: 'Доски' })).toBeNull()
		expect(boardsServiceMock.getAll).not.toHaveBeenCalled()
	})
	it('показывает дату и счётчики, открывает доску и предлагает архивацию всех досок', async () => {
		renderSection()
		const link = await screen.findByRole('link', { name: 'Открыть доску «Поддержка»' })
		expect(link.getAttribute('href')).toBe(
			'/teams/team-1/projects/project-1/board?boardId=board%20%2F2',
		)
		expect(screen.getByText('Задач: 3')).toBeDefined()
		expect(screen.getByText('Задач: 0')).toBeDefined()
		expect(screen.getAllByText('1 января 2026 г.')).toHaveLength(2)
		expect(
			screen.getByRole('button', { name: 'Архивировать доску «Основная доска»' }),
		).toBeDefined()
		expect(
			screen.getByRole('button', { name: 'Архивировать доску «Поддержка»' }),
		).toBeDefined()
	})

	it('различает загрузку, ошибку и пустой список; повторяет запрос', async () => {
		const list = deferred<BoardListItem[]>()
		boardsServiceMock.getAll.mockReturnValueOnce(list.promise).mockResolvedValueOnce([])
		renderSection()
		expect(screen.getByRole('status', { name: 'Загрузка списка досок' })).toBeDefined()
		expect(
			screen.queryByText('Пока нет досок. Создайте первую доску для проекта.'),
		).toBeNull()
		await act(async () => list.reject(new Error('network')))
		await screen.findByRole('alert')
		expect(
			screen.queryByText('Пока нет досок. Создайте первую доску для проекта.'),
		).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		await screen.findByText('Пока нет досок. Создайте первую доску для проекта.')
		expect(screen.getByRole('button', { name: 'Создать доску' })).toBeDefined()
	})

	it('создаёт доску без повторного POST, ждёт refetch и открывает её по ID', async () => {
		const created = createBoardListItemFixture({
			id: 'new /id',
			name: 'Новая доска',
			taskCount: 0,
		})
		const post = deferred<BoardListItem>()
		const refresh = deferred<BoardListItem[]>()
		boardsServiceMock.create.mockReturnValue(post.promise)
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockReturnValueOnce(refresh.promise)
		renderSection()
		await screen.findByText('Поддержка')
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		const input = screen.getByLabelText(/Название доски/)
		fireEvent.change(input, { target: { value: '  Новая доска  ' } })
		act(() => {
			fireEvent.submit(input.closest('form')!)
			fireEvent.submit(input.closest('form')!)
		})
		await waitFor(() =>
			expect(boardsServiceMock.create).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				expect.objectContaining({ name: 'Новая доска' }),
			),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Close' }))
		expect(screen.getByRole('button', { name: 'Сохраняем…' })).toHaveProperty(
			'disabled',
			true,
		)
		await act(async () => post.resolve(created))
		await waitFor(() => expect(boardsServiceMock.getAll).toHaveBeenCalledTimes(2))
		expect(push).not.toHaveBeenCalled()
		await act(async () => refresh.resolve([main, extra, created]))
		await waitFor(() =>
			expect(push).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/board?boardId=new%20%2Fid',
			),
		)
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('сохраняет название после конфликта и позволяет повторить создание', async () => {
		boardsServiceMock.create
			.mockRejectedValueOnce({ statusCode: 409, message: 'duplicate' })
			.mockResolvedValueOnce(extra)
		renderSection()
		await screen.findByText('Поддержка')
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		fireEvent.change(screen.getByLabelText(/Название доски/), {
			target: { value: 'Поддержка' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		await screen.findByRole('alert')
		expect(screen.getByLabelText(/Название доски/)).toHaveProperty('value', 'Поддержка')
		fireEvent.change(screen.getByLabelText(/Название доски/), {
			target: { value: 'Другая доска' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		await waitFor(() => expect(push).toHaveBeenCalledTimes(1))
	})

	it.each([0, 2])(
		'архивирует доску с %i задачами после подтверждения и блокирует повтор',
		async (taskCount) => {
			const board = { ...extra, taskCount }
			const archive = deferred<void>()
			boardsServiceMock.archive.mockReturnValueOnce(archive.promise)
			boardsServiceMock.getAll
				.mockResolvedValueOnce([main, board])
				.mockResolvedValueOnce([main])
			renderSection()
			fireEvent.click(
				await screen.findByRole('button', { name: 'Архивировать доску «Поддержка»' }),
			)
			expect(
				screen.getByText(
					taskCount
						? 'В архив перейдут доска и 2 задачи'
						: 'В архив перейдёт пустая доска',
				),
			).toBeDefined()
			expect(boardsServiceMock.archive).not.toHaveBeenCalled()
			const confirm = screen.getByRole('button', { name: 'Архивировать доску' })
			fireEvent.click(confirm)
			fireEvent.click(confirm)
			await waitFor(() =>
				expect(boardsServiceMock.archive).toHaveBeenCalledExactlyOnceWith(
					'team-1',
					'project-1',
					board.id,
					{ expectedUpdatedAt: board.updatedAt },
				),
			)
			expect(screen.getByRole('button', { name: 'Архивируем…' })).toHaveProperty(
				'disabled',
				true,
			)
			expect(screen.getByRole('button', { name: 'Отмена' })).toHaveProperty(
				'disabled',
				true,
			)
			fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
			expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open')
			await act(async () => archive.resolve())
			await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
			await waitFor(() => expect(screen.queryByText('Поддержка')).toBeNull())
			expect(document.activeElement).toBe(
				screen.getByRole('button', { name: 'Создать доску' }),
			)
		},
	)

	it('архивирует основную доску и показывает новую основную из ответа сервера', async () => {
		boardsServiceMock.archive.mockResolvedValue(undefined)
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockResolvedValueOnce([{ ...extra, isDefault: true }])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать доску «Основная доска»' }),
		)
		expect(screen.getByText('В архив перейдут доска и 3 задачи')).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		await waitFor(() => expect(screen.queryByText('Основная доска')).toBeNull())
		expect(
			(await screen.findByText('Основная')).closest('a')?.getAttribute('href'),
		).toContain('board%20%2F2')
	})

	it('оставляет список при ошибке архивации и позволяет повторить запрос', async () => {
		boardsServiceMock.archive
			.mockRejectedValueOnce({ statusCode: 503 })
			.mockResolvedValueOnce(undefined)
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockResolvedValueOnce([main])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать доску «Поддержка»' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		expect((await screen.findByRole('alert')).textContent).toContain(
			'Не удалось архивировать',
		)
		expect(client.getQueryData(boardsKeys.list('team-1', 'project-1'))).toEqual([
			main,
			extra,
		])
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(boardsServiceMock.archive).toHaveBeenCalledTimes(2)
	})

	it('обновляет список после конфликта и берёт актуальную версию при повторном открытии', async () => {
		const updated = { ...extra, updatedAt: '2026-11-03T13:00:00.000Z', taskCount: 4 }
		boardsServiceMock.archive
			.mockRejectedValueOnce({ statusCode: 409, message: 'conflict' })
			.mockResolvedValueOnce(undefined)
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockResolvedValueOnce([main, updated])
			.mockResolvedValueOnce([main])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать доску «Поддержка»' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		expect((await screen.findByRole('alert')).textContent).toContain('Доска изменилась')
		await screen.findByText('Задач: 4')
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		fireEvent.click(
			screen.getByRole('button', { name: 'Архивировать доску «Поддержка»' }),
		)
		expect(screen.getByText('В архив перейдут доска и 4 задачи')).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Архивировать доску' }))
		await waitFor(() =>
			expect(boardsServiceMock.archive).toHaveBeenLastCalledWith(
				'team-1',
				'project-1',
				extra.id,
				{ expectedUpdatedAt: updated.updatedAt },
			),
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})

	it.each([true, false])(
		'дожидается exit при отмене архивации и возвращает фокус (desktop=%s)',
		async (desktop) => {
			vi.stubGlobal('matchMedia', () => ({
				matches: desktop,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}))
			const getStyles = window.getComputedStyle.bind(window)
			vi.stubGlobal('CSS', { ...globalThis.CSS, escape: (value: string) => value })
			vi.stubGlobal('getComputedStyle', (element: Element, pseudo?: string | null) => {
				const styles = getStyles(element, pseudo)
				if (element.matches('[data-slot="dialog-content"], [data-slot="sheet-content"]'))
					Object.defineProperty(styles, 'animationName', {
						get: () =>
							element.getAttribute('data-state') === 'closed'
								? 'archive-exit'
								: 'archive-enter',
					})
				return styles
			})
			renderSection()
			const trigger = await screen.findByRole('button', {
				name: 'Архивировать доску «Поддержка»',
			})
			trigger.focus()
			fireEvent.click(trigger)
			const content = screen.getByRole('dialog')
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Отмена' }))
			fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
			expect(content.getAttribute('data-state')).toBe('closed')
			expect(content.isConnected).toBe(true)
			const end = new Event('animationend', { bubbles: true })
			Object.defineProperty(end, 'animationName', { value: 'archive-exit' })
			fireEvent(content, end)
			await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
			expect(document.activeElement).toBe(trigger)
			expect(boardsServiceMock.archive).not.toHaveBeenCalled()
		},
	)

	it('смена проекта закрывает форму и игнорирует запоздавший ответ создания', async () => {
		const post = deferred<BoardListItem>()
		boardsServiceMock.create.mockReturnValueOnce(post.promise)
		const { rerender } = renderSection()
		await screen.findByText('Поддержка')
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		fireEvent.change(screen.getByLabelText(/Название доски/), {
			target: { value: 'Черновик' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		await waitFor(() => expect(boardsServiceMock.create).toHaveBeenCalledTimes(1))
		rerender(<ProjectBoardsSection teamId='team-2' projectId='project-2' />)
		await screen.findByText('Поддержка')
		expect(screen.queryByRole('dialog')).toBeNull()
		await act(async () => post.resolve(extra))
		expect(push).not.toHaveBeenCalled()
	})
})
