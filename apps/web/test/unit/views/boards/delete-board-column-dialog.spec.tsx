import { createBoardColumnsFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import type * as UI from '@repo/ui'

import { DeleteBoardColumnDialog } from '@/views/boards/ui/delete-board-column-dialog'

vi.mock('@repo/ui', () => ({
	ConfirmDialog: ({
		title,
		description,
		children,
		onConfirm,
		onOpenChange,
		confirmDisabled,
		isPending,
	}: ComponentProps<typeof UI.ConfirmDialog>) => (
		<section role='dialog' aria-label={String(title)}>
			<p>{description}</p>
			{children}
			<button disabled={confirmDisabled || isPending} onClick={onConfirm}>
				{isPending ? 'Удаляем…' : 'Удалить колонку'}
			</button>
			<button disabled={isPending} onClick={() => onOpenChange(false)}>
				Отмена
			</button>
		</section>
	),
	Label: (props: ComponentProps<'label'>) => <label {...props} />,
	Select: ({
		value,
		onValueChange,
		disabled,
		children,
	}: ComponentProps<typeof UI.Select>) => (
		<select
			aria-label='Перенести задачи в колонку'
			value={value}
			onChange={(e) => onValueChange?.(e.target.value)}
			disabled={disabled}
		>
			<option value=''>Выберите колонку</option>
			{children}
		</select>
	),
	SelectTrigger: () => null,
	SelectValue: () => null,
	SelectContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
	SelectItem: ({ value, children }: ComponentProps<typeof UI.SelectItem>) => (
		<option value={value}>{children}</option>
	),
}))
afterEach(cleanup)
it.each([false, true])(
	'требует явного выбора назначения, даже для пустой колонки (%s)',
	async (empty) => {
		const columns = createBoardColumnsFixture()
		if (empty) columns[0]!.tasks = []
		const confirm = vi
			.fn<(target: string) => Promise<void>>()
			.mockResolvedValue(undefined)
		const close = vi.fn()
		render(
			<DeleteBoardColumnDialog
				column={columns[0]!}
				columns={columns}
				onConfirm={confirm}
				onClose={close}
			/>,
		)
		expect(screen.getByRole('button', { name: 'Удалить колонку' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(screen.queryByRole('option', { name: 'К выполнению' })).toBeNull()
		fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DONE' } })
		fireEvent.click(screen.getByRole('button', { name: 'Удалить колонку' }))
		await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
		expect(confirm).toHaveBeenCalledExactlyOnceWith('DONE')
	},
)
it.each(['system', 'last'])('не разрешает удалить защищённую колонку %s', (kind) => {
	const columns = createBoardColumnsFixture()
	if (kind === 'system') columns[0]!.isSystem = true
	else columns.pop()
	const confirm = vi.fn<(target: string) => Promise<void>>()
	render(
		<DeleteBoardColumnDialog
			column={columns[0]!}
			columns={columns}
			onConfirm={confirm}
			onClose={() => undefined}
		/>,
	)
	expect(screen.queryByRole('combobox')).toBeNull()
	expect(screen.getByRole('button', { name: 'Удалить колонку' })).toHaveProperty(
		'disabled',
		true,
	)
	expect(confirm).not.toHaveBeenCalled()
})
it.each([403, 404, 409, 503])(
	'сохраняет выбор после ошибки %s и позволяет повторить',
	async (statusCode) => {
		const columns = createBoardColumnsFixture()
		const confirm = vi
			.fn<(target: string) => Promise<void>>()
			.mockRejectedValueOnce({ statusCode, message: 'Error' })
			.mockResolvedValueOnce(undefined)
		const close = vi.fn()
		render(
			<DeleteBoardColumnDialog
				column={columns[0]!}
				columns={columns}
				onConfirm={confirm}
				onClose={close}
			/>,
		)
		fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DONE' } })
		fireEvent.click(screen.getByRole('button', { name: 'Удалить колонку' }))
		await screen.findByRole('alert')
		expect(screen.getByRole('combobox')).toHaveProperty('value', 'DONE')
		expect(close).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить колонку' }))
		await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
	},
)
it('при исчезновении выбранного назначения требует выбрать заново', () => {
	const columns = createBoardColumnsFixture()
	const confirm = vi.fn<(target: string) => Promise<void>>()
	const props = { column: columns[0]!, onConfirm: confirm, onClose: () => undefined }
	const { rerender } = render(<DeleteBoardColumnDialog {...props} columns={columns} />)
	fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DONE' } })
	rerender(
		<DeleteBoardColumnDialog
			{...props}
			columns={[columns[0]!, { ...columns[1]!, id: 'another' }]}
		/>,
	)
	expect(screen.getByRole('combobox')).toHaveProperty('value', '')
	expect(screen.getByRole('button', { name: 'Удалить колонку' })).toHaveProperty(
		'disabled',
		true,
	)
})
it('не повторяет отправку, не отменяется во время удаления и игнорирует завершение после unmount', async () => {
	let resolve!: () => void
	const pending = new Promise<void>((done) => {
		resolve = done
	})
	const columns = createBoardColumnsFixture()
	const confirm = vi.fn<(target: string) => Promise<void>>().mockReturnValue(pending)
	const close = vi.fn()
	const { unmount } = render(
		<DeleteBoardColumnDialog
			column={columns[0]!}
			columns={columns}
			onConfirm={confirm}
			onClose={close}
		/>,
	)
	fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DONE' } })
	const button = screen.getByRole('button', { name: 'Удалить колонку' })
	act(() => {
		fireEvent.click(button)
		fireEvent.click(button)
	})
	expect(confirm).toHaveBeenCalledTimes(1)
	expect(screen.getByRole('button', { name: 'Отмена' })).toHaveProperty('disabled', true)
	unmount()
	await act(async () => resolve())
	expect(close).not.toHaveBeenCalled()
})
