import {
	act,
	cleanup,
	createEvent,
	fireEvent,
	render,
	screen,
	within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_TASK_LABELS } from '@repo/types'

import { TaskLabelPicker } from '@/features/tasks/ui/task-label-picker'

const { query, refetch } = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }))
vi.mock('@/shared/api/use-task-labels', () => ({ useTaskLabels: query }))

const changed = vi.fn()
const submitted = vi.fn()
const blurred = vi.fn()
const inputRef = vi.fn()

function Picker({
	initial = [],
	disabled = false,
	error,
}: {
	initial?: string[]
	disabled?: boolean
	error?: string
}) {
	const [value, setValue] = useState(initial)
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault()
				submitted()
			}}
		>
			<TaskLabelPicker
				teamId='team-1'
				projectId='project-1'
				value={value}
				onChange={(next) => {
					changed(next)
					setValue(next)
				}}
				onBlur={blurred}
				inputRef={inputRef}
				disabled={disabled}
				error={error}
			/>
		</form>
	)
}

describe('TaskLabelPicker', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		query.mockReturnValue({
			data: ['refactor', 'Frontend'],
			isPending: false,
			isError: false,
			refetch,
		})
	})
	afterEach(() => {
		cleanup()
		vi.useRealTimers()
	})

	it('selects project labels, creates a normalized label with Enter and removes it', () => {
		render(<Picker />)
		const input = screen.getByRole('textbox', { name: 'Метки' })
		fireEvent.click(screen.getByRole('button', { name: 'Добавить метку «refactor»' }))
		fireEvent.change(input, { target: { value: '  Новый   модуль  ' } })
		const enter = createEvent.keyDown(input, { key: 'Enter', cancelable: true })
		fireEvent(input, enter)

		expect(enter.defaultPrevented).toBe(true)
		expect(submitted).not.toHaveBeenCalled()
		expect(changed).toHaveBeenLastCalledWith(['refactor', 'Новый модуль'])
		expect(input).toHaveProperty('value', '')
		expect(input).toBe(document.activeElement)
		const selected = screen.getByRole('list', { name: 'Метки задачи' })
		expect(within(selected).getAllByRole('listitem')).toHaveLength(2)
		fireEvent.click(screen.getByRole('button', { name: 'Снять метку «Новый модуль»' }))
		expect(changed).toHaveBeenLastCalledWith(['refactor'])
		fireEvent.blur(input)
		expect(blurred).toHaveBeenCalledOnce()
		expect(inputRef).toHaveBeenCalledWith(input)
	})

	it('avoids duplicates with different case and Unicode normalization', () => {
		render(<Picker initial={['Refactor', 'Café']} />)
		const input = screen.getByLabelText('Метки')
		for (const value of ['  REFACTOR ', 'CAFE\u0301']) {
			fireEvent.change(input, { target: { value } })
			fireEvent.keyDown(input, { key: 'Enter' })
		}
		expect(changed).not.toHaveBeenCalled()
		expect(
			within(screen.getByRole('list', { name: 'Метки задачи' })).getAllByRole('listitem'),
		).toHaveLength(2)
	})

	it('preserves the catalog spelling when adding an existing name with Enter', () => {
		render(<Picker />)
		fireEvent.change(screen.getByLabelText('Метки'), { target: { value: ' FRONTEND ' } })
		fireEvent.keyDown(screen.getByLabelText('Метки'), { key: 'Enter' })
		expect(changed).toHaveBeenCalledExactlyOnceWith(['Frontend'])
	})

	it('waits 250 ms after the last edit before searching the project catalog', () => {
		vi.useFakeTimers()
		render(<Picker />)
		const input = screen.getByLabelText('Метки')
		fireEvent.change(input, { target: { value: 'ref' } })
		act(() => vi.advanceTimersByTime(200))
		fireEvent.change(input, { target: { value: 'refactor' } })
		act(() => vi.advanceTimersByTime(249))
		expect(query).toHaveBeenLastCalledWith('team-1', 'project-1', '')
		act(() => vi.advanceTimersByTime(1))
		expect(query).toHaveBeenLastCalledWith('team-1', 'project-1', 'refactor')
	})

	it('shows at most eight unselected suggestions from the catalog', () => {
		query.mockReturnValue({
			data: Array.from({ length: 20 }, (_, index) => `label-${index}`),
			isPending: false,
			isError: false,
			refetch,
		})
		render(<Picker initial={['label-0']} />)
		expect(screen.getAllByRole('button', { name: /^Добавить метку/ })).toHaveLength(8)
		expect(screen.getByRole('button', { name: 'Добавить метку «label-1»' })).toBeDefined()
	})

	it('blocks additions at the limit and allows removal before adding another label', () => {
		const labels = Array.from({ length: MAX_TASK_LABELS }, (_, index) => `label-${index}`)
		render(<Picker initial={labels} />)
		const input = screen.getByLabelText('Метки')
		expect(input).toHaveProperty('disabled', false)
		expect(screen.getByText(/Добавлено 20 меток/)).toBeDefined()
		const add = screen.getByRole('button', { name: 'Добавить метку «refactor»' })
		expect(add).toHaveProperty('disabled', true)
		fireEvent.change(input, { target: { value: 'urgent' } })
		fireEvent.keyDown(input, { key: 'Enter' })
		expect(changed).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Снять метку «label-0»' }))
		fireEvent.keyDown(input, { key: 'Enter' })
		expect(changed).toHaveBeenLastCalledWith([...labels.slice(1), 'urgent'])
	})

	it('does not interpret Enter during IME composition as an addition', () => {
		render(<Picker />)
		const input = screen.getByLabelText('Метки')
		fireEvent.change(input, { target: { value: '入力' } })
		const enter = createEvent.keyDown(input, {
			key: 'Enter',
			isComposing: true,
			cancelable: true,
		})
		fireEvent(input, enter)
		expect(enter.defaultPrevented).toBe(false)
		expect(changed).not.toHaveBeenCalled()
		expect(input).toHaveProperty('value', '入力')
	})

	it('prevents empty Enter from submitting the task form', () => {
		render(<Picker />)
		const input = screen.getByLabelText('Метки')
		const enter = createEvent.keyDown(input, { key: 'Enter', cancelable: true })
		fireEvent(input, enter)
		expect(enter.defaultPrevented).toBe(true)
		expect(changed).not.toHaveBeenCalled()
	})

	it('reports an invalid name and clears validation when it is corrected', () => {
		render(<Picker />)
		const input = screen.getByLabelText('Метки')
		expect(input.getAttribute('maxlength')).toBe('40')
		fireEvent.change(input, { target: { value: 'x'.repeat(41) } })
		fireEvent.keyDown(input, { key: 'Enter' })
		expect(screen.getByRole('alert')).toBeDefined()
		expect(input.getAttribute('aria-invalid')).toBe('true')
		expect(changed).not.toHaveBeenCalled()
		fireEvent.change(input, { target: { value: 'valid' } })
		fireEvent.keyDown(input, { key: 'Enter' })
		expect(changed).toHaveBeenCalledExactlyOnceWith(['valid'])
		expect(input.getAttribute('aria-invalid')).toBe('false')
	})

	it('keeps selections on a catalog error and supports retry and field errors', () => {
		query.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch })
		render(<Picker initial={['refactor']} error='Проверьте метки задачи' />)
		expect(screen.getByRole('button', { name: 'Снять метку «refactor»' })).toBeDefined()
		expect(screen.getByText('Проверьте метки задачи')).toBeDefined()
		expect(screen.getByLabelText('Метки').getAttribute('aria-invalid')).toBe('true')
		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		expect(refetch).toHaveBeenCalledOnce()
		expect(changed).not.toHaveBeenCalled()
	})

	it('disables editing and removal while the task is being saved', () => {
		render(<Picker initial={['refactor']} disabled />)
		expect(screen.getByLabelText('Метки')).toHaveProperty('disabled', true)
		expect(screen.getByRole('button', { name: 'Снять метку «refactor»' })).toHaveProperty(
			'disabled',
			true,
		)
		expect(
			screen.getByRole('button', { name: 'Добавить метку «Frontend»' }),
		).toHaveProperty('disabled', true)
	})
})
