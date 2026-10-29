import '@/test/mocks/views/boards/project-boards-ui.mock'
import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import { createBoardListItemFixture } from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardListItem } from '@repo/types'

import { ProjectBoardsSection } from '@/views/boards/ui/project-boards-section'

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
})
afterEach(() => {
	cleanup()
	client.clear()
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
	it('показывает дату и реальные счётчики, ведёт в выбранную доску и защищает основную', async () => {
		renderSection()
		const link = await screen.findByRole('link', { name: 'Открыть доску «Поддержка»' })
		expect(link.getAttribute('href')).toBe(
			'/teams/team-1/projects/project-1/board?boardId=board%20%2F2',
		)
		expect(screen.getByText('Задач: 3')).toBeDefined()
		expect(screen.getByText('Задач: 0')).toBeDefined()
		expect(screen.getAllByText('1 января 2026 г.')).toHaveLength(2)
		expect(
			screen.queryByRole('button', { name: 'Удалить доску «Основная доска»' }),
		).toBeNull()
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
		const input = screen.getByLabelText('Название доски')
		fireEvent.change(input, { target: { value: '  Новая доска  ' } })
		act(() => {
			fireEvent.submit(input.closest('form')!)
			fireEvent.submit(input.closest('form')!)
		})
		await waitFor(() =>
			expect(boardsServiceMock.create).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				{ name: 'Новая доска' },
			),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Закрыть диалог' }))
		expect(screen.getByRole('button', { name: 'Создаём…' })).toHaveProperty(
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
		fireEvent.change(screen.getByLabelText('Название доски'), {
			target: { value: 'Поддержка' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
		await screen.findByRole('alert')
		expect(screen.getByLabelText('Название доски')).toHaveProperty('value', 'Поддержка')
		fireEvent.change(screen.getByLabelText('Название доски'), {
			target: { value: 'Другая доска' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
		await waitFor(() => expect(push).toHaveBeenCalledTimes(1))
	})

	it('не удаляет непустую доску и объясняет причину', async () => {
		boardsServiceMock.getAll.mockResolvedValue([main, { ...extra, taskCount: 2 }])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Удалить доску «Поддержка»' }),
		)
		expect(screen.getByRole('button', { name: 'Удалить' })).toHaveProperty(
			'disabled',
			true,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		expect(screen.getByText(/Перед удалением перенесите/)).toBeDefined()
		expect(boardsServiceMock.delete).not.toHaveBeenCalled()
	})

	it('удаляет пустую доску после подтверждения и убирает её из списка', async () => {
		const remove = deferred<void>()
		boardsServiceMock.delete.mockReturnValueOnce(remove.promise)
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockResolvedValueOnce([main])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Удалить доску «Поддержка»' }),
		)
		expect(boardsServiceMock.delete).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await waitFor(() =>
			expect(boardsServiceMock.delete).toHaveBeenCalledExactlyOnceWith(
				'team-1',
				'project-1',
				'board /2',
			),
		)
		expect(screen.getByRole('button', { name: 'Удаляем…' })).toHaveProperty(
			'disabled',
			true,
		)
		await act(async () => remove.resolve())
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(screen.queryByText('Поддержка')).toBeNull()
	})

	it('сохраняет отказ удаления и обновляет счётчик при появлении задач', async () => {
		boardsServiceMock.delete.mockRejectedValueOnce({
			statusCode: 409,
			message: 'conflict',
		})
		boardsServiceMock.getAll
			.mockResolvedValueOnce([main, extra])
			.mockResolvedValueOnce([main, { ...extra, taskCount: 1 }])
		renderSection()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Удалить доску «Поддержка»' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await screen.findByRole('alert')
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Удалить' })).toHaveProperty(
				'disabled',
				true,
			),
		)
		expect(screen.getByRole('dialog')).toBeDefined()
	})

	it('смена проекта закрывает форму и игнорирует запоздавший ответ создания', async () => {
		const post = deferred<BoardListItem>()
		boardsServiceMock.create.mockReturnValueOnce(post.promise)
		const { rerender } = renderSection()
		await screen.findByText('Поддержка')
		fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))
		fireEvent.change(screen.getByLabelText('Название доски'), {
			target: { value: 'Черновик' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
		await waitFor(() => expect(boardsServiceMock.create).toHaveBeenCalledTimes(1))
		rerender(<ProjectBoardsSection teamId='team-2' projectId='project-2' />)
		await screen.findByText('Поддержка')
		expect(screen.queryByRole('dialog')).toBeNull()
		await act(async () => post.resolve(extra))
		expect(push).not.toHaveBeenCalled()
	})
})
