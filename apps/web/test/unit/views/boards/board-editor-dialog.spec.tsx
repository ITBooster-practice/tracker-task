import '@/test/mocks/api/boards-service.mock'

import { boardsServiceMock } from '@/test/mocks/api/boards-service.mock'
import {
	createBoardListItemFixture,
	createBoardTaskFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { BoardView } from '@repo/types'

import { toBoardColumnsViewModel } from '@/views/boards/model/adapters'
import { BoardColumn } from '@/views/boards/ui/board-column'
import { BoardEditorDialog } from '@/views/boards/ui/board-editor-dialog'

let client: QueryClient
beforeEach(() => {
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
	Object.values(boardsServiceMock).forEach((mock) => mock.mockReset())
	client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
})
afterEach(() => {
	cleanup()
	client.clear()
	vi.unstubAllGlobals()
})
const Wrapper = ({ children }: React.PropsWithChildren) => (
	<QueryClientProvider client={client}>{children}</QueryClientProvider>
)
const view = () => {
	const value = createBoardViewFixture()
	value.columns.push({
		...value.columns[0]!,
		id: 'done',
		key: 'DONE',
		title: 'Готово',
		position: 1,
		tasks: [],
	})
	return value
}
const chainView = () => {
	const board = view()
	board.columns[1]!.title = 'В работе'
	board.columns[1]!.key = 'IN_PROGRESS'
	board.columns[1]!.tasks = [
		createBoardTaskFixture({ id: 'second-task', boardColumnId: 'done' }),
	]
	board.columns.push({
		...board.columns[1]!,
		id: 'final',
		key: 'DONE',
		title: 'Готово',
		position: 2,
		tasks: [],
	})
	return board
}
const click = async (element: HTMLElement) => {
	await act(async () => {
		fireEvent.click(element)
	})
}
const change = async (element: HTMLElement, value: string) => {
	await act(async () => {
		fireEvent.change(element, { target: { value } })
	})
}
const keyDown = async (element: HTMLElement, key: string) => {
	await act(async () => {
		fireEvent.keyDown(element, { key })
	})
}
const renderEditor = (board: BoardView = view(), onClose = vi.fn()) => {
	render(
		<BoardEditorDialog
			teamId='team-1'
			projectId='project-1'
			view={board}
			onClose={onClose}
		/>,
		{ wrapper: Wrapper },
	)
	return onClose
}
const save = () => click(screen.getByRole('button', { name: 'Сохранить изменения' }))
const markForRemoval = async (title: string, destination: string) => {
	await click(screen.getByRole('button', { name: `Удалить колонку «${title}»` }))
	await click(screen.getByRole('radio', { name: destination }))
	await click(screen.getByRole('button', { name: 'Удалить при сохранении' }))
}

it('переводит фокус из меню в настройки и возвращает его после отмены', async () => {
	const board = view()
	function Harness() {
		const [open, setOpen] = useState(false)
		return (
			<>
				<BoardColumn
					headerOnly
					column={toBoardColumnsViewModel(board)[0]!}
					onOpenTask={vi.fn()}
					activeDragTaskId={null}
					onConfigure={() => setOpen(true)}
				/>
				{open && (
					<BoardEditorDialog
						teamId='team-1'
						projectId='project-1'
						view={board}
						selectedColumnId={board.columns[0]!.id}
						onClose={() => setOpen(false)}
					/>
				)}
			</>
		)
	}
	render(<Harness />, { wrapper: Wrapper })
	const trigger = screen.getByRole('button', { name: 'Меню колонки «To do»' })
	await keyDown(trigger, 'Enter')
	await click(screen.getByRole('menuitem', { name: 'Настроить колонку' }))
	await waitFor(() =>
		expect(document.activeElement).toBe(
			screen.getByRole('textbox', { name: 'Название доски *' }),
		),
	)
	await click(screen.getByRole('button', { name: 'Отмена' }))
	await waitFor(() => expect(document.activeElement).toBe(trigger))
})

it('сохраняет название, цвета, новую колонку и перенос задач одним запросом', async () => {
	const board = view(),
		original = structuredClone(board)
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	const close = renderEditor(board)
	await click(screen.getByRole('button', { name: 'Переименовать колонку «To do»' }))
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'План')
	await keyDown(screen.getByRole('textbox', { name: 'Название колонки' }), 'Enter')
	await click(screen.getByRole('button', { name: 'Изменить цвет колонки «Готово»' }))
	await click(screen.getByRole('radio', { name: 'Красный' }))
	await click(screen.getByRole('button', { name: 'Добавить колонку' }))
	await change(screen.getByRole('textbox', { name: 'Название новой колонки' }), 'Релиз')
	await click(screen.getByRole('button', { name: 'Изменить цвет колонки «Релиз»' }))
	await click(screen.getByRole('radio', { name: 'Фиолетовый' }))
	await markForRemoval('План', 'Релиз')
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	expect(board).toEqual(original)
	await save()
	await waitFor(() => expect(close).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update).toHaveBeenCalledExactlyOnceWith(
		'team-1',
		'project-1',
		board.board.id,
		expect.objectContaining({
			expectedUpdatedAt: board.board.updatedAt,
			columnSnapshot: board.columns.map(({ id, updatedAt }) => ({ id, updatedAt })),
			columns: [
				expect.objectContaining({ id: 'done', title: 'Готово', color: 'red' }),
				expect.objectContaining({
					title: 'Релиз',
					key: expect.stringMatching(/^column_/),
					color: 'violet',
				}),
			],
			removedColumns: [
				{ id: board.columns[0]!.id, targetKey: expect.stringMatching(/^column_/) },
			],
		}),
	)
	const payload = boardsServiceMock.update.mock.calls[0]![3]
	expect(payload.removedColumns?.[0]?.targetKey).toBe(payload.columns?.[1]?.key)
})

it('подтверждает переименование по Enter и Check, восстанавливает исходное имя по Escape', async () => {
	renderEditor()
	await click(screen.getByRole('button', { name: 'Переименовать колонку «To do»' }))
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'План')
	await keyDown(screen.getByRole('textbox', { name: 'Название колонки' }), 'Enter')
	await click(screen.getByRole('button', { name: 'Переименовать колонку «План»' }))
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'Спринт')
	await click(
		screen.getByRole('button', { name: 'Завершить переименование колонки «Спринт»' }),
	)
	await click(screen.getByRole('button', { name: 'Переименовать колонку «Спринт»' }))
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'Не сохранять')
	await keyDown(screen.getByRole('textbox', { name: 'Название колонки' }), 'Escape')
	expect(
		screen.getByRole('button', { name: 'Переименовать колонку «Спринт»' }),
	).toBeDefined()
	expect(screen.getByRole('dialog')).toBeDefined()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
})

it('оставляет новую колонку раскрытым черновиком после ввода, Enter и выбора цвета', async () => {
	renderEditor()
	await click(screen.getByRole('button', { name: 'Добавить колонку' }))
	const input = screen.getByRole('textbox', { name: 'Название новой колонки' })
	await change(input, 'Релиз')
	await keyDown(input, 'Enter')
	expect(screen.getByRole('textbox', { name: 'Название новой колонки' })).toHaveProperty(
		'value',
		'Релиз',
	)
	await click(screen.getByRole('button', { name: 'Изменить цвет колонки «Релиз»' }))
	expect(screen.getByRole('radiogroup', { name: 'Цвет колонки «Релиз»' })).toBeDefined()
	await click(screen.getByRole('radio', { name: 'Зелёный' }))
	expect(screen.getByRole('textbox', { name: 'Название новой колонки' })).toHaveProperty(
		'value',
		'Релиз',
	)
	await click(screen.getByRole('button', { name: 'Отменить добавление колонки «Релиз»' }))
	expect(screen.queryByRole('textbox', { name: 'Название новой колонки' })).toBeNull()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
})

it('закрывает палитру без изменения выбранного цвета', async () => {
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	renderEditor()
	const trigger = screen.getByRole('button', { name: 'Изменить цвет колонки «To do»' })
	await click(trigger)
	expect(trigger.getAttribute('aria-expanded')).toBe('true')
	expect(screen.getByRole('radio', { name: 'Синий' }).getAttribute('aria-checked')).toBe(
		'true',
	)
	await click(screen.getByRole('button', { name: 'Закрыть палитру' }))
	await waitFor(() =>
		expect(screen.queryByRole('radiogroup', { name: 'Цвет колонки «To do»' })).toBeNull(),
	)
	expect(trigger.getAttribute('aria-expanded')).toBe('false')
	await waitFor(() => expect(document.activeElement).toBe(trigger))
	await save()
	await waitFor(() => expect(boardsServiceMock.update).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update.mock.calls[0]![3].columns?.[0]).toMatchObject({
		color: 'blue',
	})
})

it('не подтверждает непустое удаление до выбора назначения и не записывает изменения сразу', async () => {
	const board = view(),
		baseline = structuredClone(board)
	renderEditor(board)
	await click(screen.getByRole('button', { name: 'Удалить колонку «To do»' }))
	const panel = screen.getByRole('group', { name: 'Подтверждение удаления колонки' })
	expect(
		within(panel).getByRole('button', { name: 'Удалить при сохранении' }),
	).toHaveProperty('disabled', true)
	expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
		'disabled',
		true,
	)
	await click(within(panel).getByRole('radio', { name: 'Готово' }))
	await click(within(panel).getByRole('button', { name: 'Удалить при сохранении' }))
	expect(screen.getByText(/To do · будет удалена/)).toBeDefined()
	expect(
		screen.getByRole('button', { name: 'Отменить удаление колонки «To do»' }),
	).toBeDefined()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	expect(board).toEqual(baseline)
})

it.each(['пустую', 'непустую'])(
	'отменяет пометку удаления: %s колонку снова сохраняет активной',
	async (kind) => {
		const board = view(),
			title = kind === 'пустую' ? 'Готово' : 'To do'
		boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
		renderEditor(board)
		if (kind === 'пустую')
			await click(screen.getByRole('button', { name: `Удалить колонку «${title}»` }))
		else await markForRemoval(title, 'Готово')
		await click(
			screen.getByRole('button', { name: `Отменить удаление колонки «${title}»` }),
		)
		expect(
			screen.getByRole('button', { name: `Удалить колонку «${title}»` }),
		).toHaveProperty('disabled', false)
		await save()
		await waitFor(() => expect(boardsServiceMock.update).toHaveBeenCalledOnce())
		expect(boardsServiceMock.update.mock.calls[0]![3]).toMatchObject({
			columns: board.columns.map(({ id, key, title, color }) => ({
				id,
				key,
				title,
				color,
			})),
			removedColumns: [],
		})
	},
)

it('помечает пустую колонку до сохранения и отправляет защиту от появления задач', async () => {
	const board = view()
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	const close = renderEditor(board)
	await click(screen.getByRole('button', { name: 'Удалить колонку «Готово»' }))
	expect(
		screen.queryByRole('radiogroup', { name: 'Колонка для переноса задач' }),
	).toBeNull()
	expect(screen.getByText(/Готово · будет удалена/)).toBeDefined()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	await save()
	await waitFor(() => expect(close).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update.mock.calls[0]![3].removedColumns).toEqual([
		{ id: 'done', targetKey: board.columns[0]!.key, requireEmpty: true },
	])
})

it.each([0, 4])(
	'показывает ожидаемую прибавку отдельно от исходных %i задач и убирает её при отмене',
	async (existing) => {
		const board = view()
		board.columns[0]!.tasks = Array.from({ length: 4 }, (_, index) =>
			createBoardTaskFixture({
				id: `source-${index}`,
				boardColumnId: board.columns[0]!.id,
			}),
		)
		board.columns[1]!.tasks = Array.from({ length: existing }, (_, index) =>
			createBoardTaskFixture({ id: `target-${index}`, boardColumnId: 'done' }),
		)
		renderEditor(board)
		await markForRemoval('To do', 'Готово')
		const destination = within(document.getElementById('column-draft-done')!)
		expect(destination.getByText(existing ? '+ ещё 4' : '+ ещё 4 задачи')).toBeDefined()
		if (existing) expect(destination.getByText('4 задачи')).toBeDefined()
		await click(screen.getByRole('button', { name: 'Отменить удаление колонки «To do»' }))
		expect(destination.getByText(existing ? '4 задачи' : '0 задач')).toBeDefined()
		expect(boardsServiceMock.update).not.toHaveBeenCalled()
	},
)

it('отмена удаления промежуточной колонки сохраняет перенос в восстановленную колонку', async () => {
	const board = chainView()
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	renderEditor(board)
	await markForRemoval('To do', 'В работе')
	await markForRemoval('В работе', 'Готово')
	expect(
		within(document.getElementById('column-draft-final')!).getByText('+ ещё 2 задачи'),
	).toBeDefined()
	await click(
		within(document.getElementById('column-draft-done')!).getByRole('button', {
			name: 'Отменить удаление колонки «В работе»',
		}),
	)
	const restored = within(document.getElementById('column-draft-done')!)
	expect(restored.getByText('1 задача')).toBeDefined()
	expect(restored.getByText('+ ещё 1')).toBeDefined()
	expect(
		within(document.getElementById('column-draft-final')!).getByText('0 задач'),
	).toBeDefined()
	await save()
	await waitFor(() => expect(boardsServiceMock.update).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update.mock.calls[0]![3]).toMatchObject({
		columns: [
			expect.objectContaining({ id: 'done', key: 'IN_PROGRESS' }),
			expect.objectContaining({ id: 'final', key: 'DONE' }),
		],
		removedColumns: [{ id: board.columns[0]!.id, targetKey: 'IN_PROGRESS' }],
	})
})

it('сохраняет оба переноса цепочки в конечную активную колонку', async () => {
	const board = chainView()
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	renderEditor(board)
	await markForRemoval('To do', 'В работе')
	await markForRemoval('В работе', 'Готово')
	await save()
	await waitFor(() => expect(boardsServiceMock.update).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update.mock.calls[0]![3]).toMatchObject({
		columns: [expect.objectContaining({ id: 'final', key: 'DONE' })],
		removedColumns: [
			{ id: board.columns[0]!.id, targetKey: 'DONE' },
			{ id: 'done', targetKey: 'DONE' },
		],
	})
})

it('при отмене новой колонки с входящим переносом требует новое назначение задач', async () => {
	const board = view()
	boardsServiceMock.update.mockResolvedValue(createBoardListItemFixture())
	renderEditor(board)
	await click(screen.getByRole('button', { name: 'Добавить колонку' }))
	await change(screen.getByRole('textbox', { name: 'Название новой колонки' }), 'Релиз')
	await markForRemoval('To do', 'Релиз')
	expect(screen.getByText('+ ещё 1 задача')).toBeDefined()
	await click(screen.getByRole('button', { name: 'Отменить добавление колонки «Релиз»' }))
	const panel = screen.getByRole('group', { name: 'Подтверждение удаления колонки' })
	expect(
		within(panel).getByRole('button', { name: 'Удалить при сохранении' }),
	).toHaveProperty('disabled', true)
	expect(screen.getByRole('textbox', { name: 'Название новой колонки' })).toHaveProperty(
		'value',
		'Релиз',
	)
	await click(within(panel).getByRole('radio', { name: 'Готово' }))
	await click(within(panel).getByRole('button', { name: 'Удалить при сохранении' }))
	expect(screen.queryByRole('textbox', { name: 'Название новой колонки' })).toBeNull()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	await save()
	await waitFor(() => expect(boardsServiceMock.update).toHaveBeenCalledOnce())
	expect(boardsServiceMock.update.mock.calls[0]![3]).toMatchObject({
		columns: [expect.objectContaining({ id: 'done', key: 'DONE' })],
		removedColumns: [{ id: board.columns[0]!.id, targetKey: 'DONE' }],
	})
})

it('отмена окна оставляет настройки на сервере и исходные данные без изменений', async () => {
	const board = view(),
		original = structuredClone(board)
	const close = renderEditor(board)
	await change(screen.getByLabelText('Название доски *'), 'Черновик')
	await click(screen.getByRole('button', { name: 'Удалить колонку «Готово»' }))
	await click(screen.getByRole('button', { name: 'Добавить колонку' }))
	await change(screen.getByRole('textbox', { name: 'Название новой колонки' }), 'Релиз')
	await click(screen.getByRole('button', { name: 'Отмена' }))
	expect(close).toHaveBeenCalledOnce()
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	expect(board).toEqual(original)
})

it('защищает системную колонку от удаления', async () => {
	const board = view()
	board.columns[0]!.isSystem = true
	renderEditor(board)
	expect(screen.getByRole('button', { name: 'Удалить колонку «To do»' })).toHaveProperty(
		'disabled',
		true,
	)
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
})

it('защищает последнюю активную колонку после пометки других на удаление', async () => {
	renderEditor()
	await click(screen.getByRole('button', { name: 'Удалить колонку «Готово»' }))
	expect(screen.getByRole('button', { name: 'Удалить колонку «To do»' })).toHaveProperty(
		'disabled',
		true,
	)
	expect(
		screen.queryByRole('group', { name: 'Подтверждение удаления колонки' }),
	).toBeNull()
})

it('проверяет дубли названий до записи и сохраняет черновик при конфликте API', async () => {
	boardsServiceMock.update.mockRejectedValue({ statusCode: 409, message: 'Conflict' })
	renderEditor()
	await click(screen.getByRole('button', { name: 'Переименовать колонку «To do»' }))
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'Готово')
	await keyDown(screen.getByRole('textbox', { name: 'Название колонки' }), 'Enter')
	expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toHaveProperty(
		'disabled',
		true,
	)
	await act(async () => {
		fireEvent.submit(screen.getByLabelText('Название доски *').closest('form')!)
	})
	await screen.findByRole('alert')
	expect(boardsServiceMock.update).not.toHaveBeenCalled()
	await click(
		screen.getAllByRole('button', { name: 'Переименовать колонку «Готово»' })[0]!,
	)
	await change(screen.getByRole('textbox', { name: 'Название колонки' }), 'Новый этап')
	await keyDown(screen.getByRole('textbox', { name: 'Название колонки' }), 'Enter')
	await save()
	await waitFor(() =>
		expect(screen.getByRole('alert').textContent).toContain('Настройки изменились'),
	)
	expect(
		screen.getByRole('button', { name: 'Переименовать колонку «Новый этап»' }),
	).toBeDefined()
})

it('блокирует повторную отправку и закрытие до окончания сохранения', async () => {
	let resolve!: (value: ReturnType<typeof createBoardListItemFixture>) => void
	boardsServiceMock.create.mockReturnValue(
		new Promise((yes) => {
			resolve = yes
		}),
	)
	const close = vi.fn()
	render(<BoardEditorDialog teamId='team-1' projectId='project-1' onClose={close} />, {
		wrapper: Wrapper,
	})
	await change(screen.getByLabelText('Название доски *'), 'Итерация')
	const form = screen.getByLabelText('Название доски *').closest('form')!
	await act(async () => {
		fireEvent.submit(form)
		fireEvent.submit(form)
	})
	await waitFor(() => expect(boardsServiceMock.create).toHaveBeenCalledOnce())
	await click(screen.getByRole('button', { name: 'Close' }))
	expect(close).not.toHaveBeenCalled()
	expect(screen.getByRole('button', { name: 'Сохраняем…' })).toHaveProperty(
		'disabled',
		true,
	)
	await act(async () => resolve(createBoardListItemFixture()))
	await waitFor(() => expect(close).toHaveBeenCalledOnce())
})
