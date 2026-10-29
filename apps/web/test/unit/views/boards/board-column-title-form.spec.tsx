import '@/test/mocks/views/boards/project-boards-ui.mock'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BoardColumnTitleForm } from '@/views/boards/ui/board-column-title-form'

const columns = [
	{ id: 'todo', title: 'К выполнению' },
	{ id: 'done', title: 'Готово' },
]
afterEach(cleanup)

function deferred() {
	let resolve!: () => void
	let reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}

describe('BoardColumnTitleForm', () => {
	it.each(['', '  ', 'x'.repeat(101)])(
		'не отправляет недопустимое название %j',
		(title) => {
			const submit = vi.fn<(title: string) => Promise<void>>()
			render(
				<BoardColumnTitleForm
					columns={columns}
					onSubmit={submit}
					onDone={() => undefined}
				/>,
			)
			const input = screen.getByLabelText('Название новой колонки')
			fireEvent.change(input, { target: { value: title } })
			fireEvent.submit(input.closest('form')!)
			expect(screen.getByRole('alert')).toBeDefined()
			expect(input.getAttribute('aria-invalid')).toBe('true')
			expect(submit).not.toHaveBeenCalled()
		},
	)

	it('проверяет дубликат по нормализованному названию в выбранной доске', () => {
		const submit = vi.fn<(title: string) => Promise<void>>()
		render(
			<BoardColumnTitleForm
				columns={columns}
				onSubmit={submit}
				onDone={() => undefined}
			/>,
		)
		const input = screen.getByLabelText('Название новой колонки')
		fireEvent.change(input, { target: { value: '  Готово  ' } })
		fireEvent.submit(input.closest('form')!)
		expect(screen.getByRole('alert').textContent).toContain('уже есть')
		expect(submit).not.toHaveBeenCalled()
	})

	it('не перезаписывает серверное переименование при сохранении неизменённого черновика', () => {
		const submit = vi.fn<(title: string) => Promise<void>>()
		const done = vi.fn()
		const { rerender } = render(
			<BoardColumnTitleForm
				columnId='todo'
				initialTitle='К выполнению'
				columns={columns}
				onSubmit={submit}
				onDone={done}
			/>,
		)
		rerender(
			<BoardColumnTitleForm
				columnId='todo'
				initialTitle='Новое название на сервере'
				columns={[{ id: 'todo', title: 'Новое название на сервере' }]}
				onSubmit={submit}
				onDone={done}
			/>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		expect(submit).not.toHaveBeenCalled()
		expect(done).toHaveBeenCalledTimes(1)
	})

	it('нормализует название, защищает от повторной отправки и не отменяется во время запроса', async () => {
		const pending = deferred()
		const submit = vi
			.fn<(title: string) => Promise<void>>()
			.mockReturnValue(pending.promise)
		const done = vi.fn()
		render(<BoardColumnTitleForm columns={columns} onSubmit={submit} onDone={done} />)
		const input = screen.getByLabelText('Название новой колонки')
		fireEvent.change(input, { target: { value: '  Проверка  ' } })
		act(() => {
			fireEvent.submit(input.closest('form')!)
			fireEvent.submit(input.closest('form')!)
		})
		expect(submit).toHaveBeenCalledExactlyOnceWith('Проверка')
		expect(screen.getByRole('button', { name: 'Сохраняем…' })).toHaveProperty(
			'disabled',
			true,
		)
		fireEvent.keyDown(input, { key: 'Escape' })
		expect(done).not.toHaveBeenCalled()
		await act(async () => pending.resolve())
		await waitFor(() => expect(done).toHaveBeenCalledTimes(1))
	})

	it.each([403, 404, 409, 503])(
		'сохраняет черновик после ошибки %s и позволяет повторить',
		async (statusCode) => {
			const submit = vi
				.fn<(title: string) => Promise<void>>()
				.mockRejectedValueOnce({ statusCode, message: 'API error' })
				.mockResolvedValueOnce(undefined)
			const done = vi.fn()
			const { rerender } = render(
				<BoardColumnTitleForm columns={columns} onSubmit={submit} onDone={done} />,
			)
			const input = screen.getByLabelText('Название новой колонки')
			fireEvent.change(input, { target: { value: 'Мой черновик' } })
			fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
			await screen.findByRole('alert')
			rerender(
				<BoardColumnTitleForm columns={[...columns]} onSubmit={submit} onDone={done} />,
			)
			expect(input).toHaveProperty('value', 'Мой черновик')
			expect(input).toHaveProperty('disabled', false)
			expect(done).not.toHaveBeenCalled()
			fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
			await waitFor(() => expect(done).toHaveBeenCalledTimes(1))
		},
	)

	it('отменяется по Escape и не сообщает об успехе после размонтирования', async () => {
		const pending = deferred()
		const done = vi.fn()
		const submit = vi
			.fn<(title: string) => Promise<void>>()
			.mockReturnValue(pending.promise)
		const { unmount } = render(
			<BoardColumnTitleForm columns={columns} onSubmit={submit} onDone={done} />,
		)
		const input = screen.getByLabelText('Название новой колонки')
		fireEvent.keyDown(input, { key: 'Escape' })
		expect(done).toHaveBeenCalledTimes(1)
		done.mockClear()
		fireEvent.change(input, { target: { value: 'Проверка' } })
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
		unmount()
		await act(async () => pending.resolve())
		expect(done).not.toHaveBeenCalled()
	})
})
