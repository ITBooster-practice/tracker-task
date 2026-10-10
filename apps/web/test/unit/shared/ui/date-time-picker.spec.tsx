import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	DateTimePicker,
	normalizeTime,
	parseLocalDateTime,
	TimePicker,
	type DateTimePickerProps,
} from '@repo/ui'

const server = new Date(2026, 9, 10, 12, 34, 30)
function Example(props: Partial<DateTimePickerProps>) {
	const [value, setValue] = useState(props.value ?? '')
	return (
		<form>
			<DateTimePicker {...props} value={value} onChange={setValue} />
			<output data-testid='value'>{value}</output>
		</form>
	)
}
beforeEach(() => {
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
	vi.restoreAllMocks()
})
describe('Shared date and time picker', () => {
	it('supports keyboard input without time and rejects impossible dates', () => {
		render(<Example />)
		const input = screen.getByLabelText('Дата') as HTMLInputElement
		fireEvent.change(input, { target: { value: '10.10.2028' } })
		expect(screen.getByTestId('value').textContent).toBe('2028-10-10')
		expect(screen.queryByLabelText('Время')).toBeNull()
		fireEvent.change(input, { target: { value: '31.02.2028' } })
		expect(input.checkValidity()).toBe(false)
		expect(screen.getByTestId('value').textContent).toBe('2028-10-10')
		fireEvent.change(input, { target: { value: '' } })
		expect(screen.getByTestId('value').textContent).toBe('')
	})
	it('adds date separators to digits, handles paste and deletion', () => {
		render(<Example />)
		const input = screen.getByLabelText('Дата') as HTMLInputElement
		for (const [typed, expected] of [
			['2', '2'],
			['24', '24'],
			['240', '24.0'],
			['24.02', '24.02'],
			['24.022', '24.02.2'],
			['24.02.2028', '24.02.2028'],
		]) {
			fireEvent.change(input, { target: { value: typed } })
			expect(input.value).toBe(expected)
		}
		expect(screen.getByTestId('value').textContent).toBe('2028-02-24')
		fireEvent.change(input, { target: { value: '24021995' } })
		expect(input.value).toBe('24.02.1995')
		fireEvent.change(input, { target: { value: '1.2.2028' } })
		expect(input.value).toBe('01.02.2028')
		fireEvent.change(input, { target: { value: '31.02.2028' } })
		expect(input.checkValidity()).toBe(false)
		fireEvent.change(input, { target: { value: '' } })
		expect(input.value).toBe('')
		expect(screen.getByTestId('value').textContent).toBe('')
	})
	it('formats compact input without allowing a past server deadline', () => {
		render(<Example withTime minValue={server} referenceDate={server} />)
		const input = screen.getByLabelText('Дата') as HTMLInputElement
		fireEvent.change(input, { target: { value: '24021995' } })
		expect(input.value).toBe('24.02.1995')
		expect(input.checkValidity()).toBe(false)
		expect(screen.getByRole('alert').textContent).toContain('не раньше')
		expect(screen.getByTestId('value').textContent).toBe('')
	})
	it('uses the supplied clock even if the computer clock is years ahead', () => {
		vi.spyOn(Date, 'now').mockReturnValue(new Date(2040, 1, 1).getTime())
		render(<Example withTime minValue={server} referenceDate={server} />)
		const date = screen.getByLabelText('Дата') as HTMLInputElement
		fireEvent.change(date, { target: { value: '09.10.2026' } })
		expect(date.checkValidity()).toBe(false)
		expect(screen.getByTestId('value').textContent).toBe('')
		fireEvent.change(date, { target: { value: '10.10.2026' } })
		expect(screen.getByTestId('value').textContent).toBe('2026-10-10T12:35')
		const time = screen.getByLabelText('Время') as HTMLInputElement
		expect(time.type).toBe('text')
		fireEvent.change(time, { target: { value: '12:34' } })
		expect(time.checkValidity()).toBe(false)
		expect(screen.getByTestId('value').textContent).toBe('2026-10-10T12:35')
		fireEvent.change(time, { target: { value: '1330' } })
		fireEvent.blur(time)
		expect(time.value).toBe('13:30')
		expect(screen.getByTestId('value').textContent).toBe('2026-10-10T13:30')
	})
	it('exposes shadcn month/year and time selects instead of native selects', () => {
		render(
			<Example
				withTime
				value='2026-10-10T12:35'
				minValue={server}
				referenceDate={server}
			/>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }))
		expect(screen.getByRole('combobox', { name: 'Месяц' })).toBeDefined()
		expect(screen.getByRole('combobox', { name: 'Год' })).toBeDefined()
		expect(document.querySelector('select')).toBeNull()
		fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
		fireEvent.click(screen.getByRole('button', { name: 'Выбрать время' }))
		expect(screen.getByRole('combobox', { name: 'Часы' })).toBeDefined()
		expect(screen.getByRole('combobox', { name: 'Минуты' })).toBeDefined()
		expect(document.querySelector('input[type=time]')).toBeNull()
	})
	it('keeps the calendar DOM and focus when the server minimum changes', () => {
		const { rerender } = render(
			<Example withTime minValue={server} referenceDate={server} />,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }))
		const year = screen.getByRole('combobox', { name: 'Год' })
		year.focus()
		const next = new Date(server.getTime() + 1000)
		rerender(<Example withTime minValue={next} referenceDate={next} />)
		expect(screen.getByRole('combobox', { name: 'Год' })).toBe(year)
		expect(document.activeElement).toBe(year)
	})
	it('moves the first available day past midnight when no whole minute remains', () => {
		render(
			<Example
				withTime
				minValue={new Date(2026, 9, 10, 23, 59, 30)}
				referenceDate={server}
			/>,
		)
		const date = screen.getByLabelText('Дата') as HTMLInputElement
		fireEvent.change(date, { target: { value: '10.10.2026' } })
		expect(date.checkValidity()).toBe(false)
		fireEvent.change(date, { target: { value: '11.10.2026' } })
		expect(screen.getByTestId('value').textContent).toBe('2026-10-11T00:00')
	})
	it('preserves a saved historic value until it is edited', () => {
		render(
			<Example
				withTime
				value='2026-10-09T12:00'
				minValue={server}
				referenceDate={server}
			/>,
		)
		expect((screen.getByLabelText('Дата') as HTMLInputElement).checkValidity()).toBe(true)
		expect((screen.getByLabelText('Время') as HTMLInputElement).checkValidity()).toBe(
			true,
		)
	})
	it('validates upper bounds and disabled controls', () => {
		const { rerender } = render(<Example maxValue={new Date(2028, 9, 10)} />)
		const date = screen.getByLabelText('Дата') as HTMLInputElement
		fireEvent.change(date, { target: { value: '11.10.2028' } })
		expect(date.checkValidity()).toBe(false)
		rerender(<TimePicker value='18:00' onChange={vi.fn()} max='18:00' />)
		fireEvent.change(screen.getByLabelText('Время'), { target: { value: '18:01' } })
		expect((screen.getByLabelText('Время') as HTMLInputElement).checkValidity()).toBe(
			false,
		)
		rerender(<Example disabled withTime value='2028-10-10T12:00' />)
		expect((screen.getByLabelText('Дата') as HTMLInputElement).disabled).toBe(true)
		expect(
			(screen.getByRole('button', { name: 'Выбрать время' }) as HTMLButtonElement)
				.disabled,
		).toBe(true)
	})
	it('strictly parses local values and normalizes keyboard time', () => {
		expect(parseLocalDateTime('2028-02-29T23:59')).not.toBeNull()
		expect(parseLocalDateTime('2027-02-29')).toBeNull()
		expect(parseLocalDateTime('2028-10-10T24:00')).toBeNull()
		expect(normalizeTime('9:05')).toBe('09:05')
		expect(normalizeTime('2460')).toBeNull()
	})
})
