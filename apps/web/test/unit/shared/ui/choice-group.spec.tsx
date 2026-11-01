import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChoiceGroup, ChoiceGroupItem } from '@repo/ui'
import { Bug, CircleDot } from '@repo/ui/icons'

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
})

function Example({
	disabled = false,
	onChange = vi.fn(),
	onSubmit = vi.fn(),
}: {
	disabled?: boolean
	onChange?: (value: string) => void
	onSubmit?: () => void
}) {
	const [value, setValue] = useState('task')
	return (
		<form onSubmit={onSubmit}>
			<ChoiceGroup
				aria-label='Тип задачи'
				name='type'
				value={value}
				disabled={disabled}
				onValueChange={(next) => {
					setValue(next)
					onChange(next)
				}}
			>
				<ChoiceGroupItem value='task' icon={<CircleDot />}>
					Задача
				</ChoiceGroupItem>
				<ChoiceGroupItem value='bug' tone='danger' icon={<Bug />}>
					Баг
				</ChoiceGroupItem>
			</ChoiceGroup>
		</form>
	)
}

describe('ChoiceGroup', () => {
	it('selects one visible option with one click without submitting the form', () => {
		const onChange = vi.fn(),
			onSubmit = vi.fn()
		render(<Example onChange={onChange} onSubmit={onSubmit} />)
		fireEvent.click(screen.getByRole('radio', { name: 'Баг' }))
		expect(screen.getByRole('radio', { name: 'Баг', checked: true })).toBeDefined()
		expect(screen.getByRole('radio', { name: 'Задача', checked: false })).toBeDefined()
		expect(onChange).toHaveBeenCalledExactlyOnceWith('bug')
		fireEvent.click(screen.getByRole('radio', { name: 'Баг' }))
		expect(onChange).toHaveBeenCalledOnce()
		expect(onSubmit).not.toHaveBeenCalled()
	})
	it('moves focus and selection with arrow keys', async () => {
		render(<Example />)
		const first = screen.getByRole('radio', { name: 'Задача' })
		act(() => first.focus())
		fireEvent.keyDown(first, { key: 'ArrowRight' })
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Баг' })),
		)
		expect(screen.getByRole('radio', { name: 'Баг', checked: true })).toBeDefined()
		fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
		await waitFor(() => expect(document.activeElement).toBe(first))
		expect(screen.getByRole('radio', { name: 'Задача', checked: true })).toBeDefined()
	})
	it('disables every option while the form is submitting', () => {
		const onChange = vi.fn()
		render(<Example disabled onChange={onChange} />)
		for (const radio of screen.getAllByRole('radio'))
			expect(radio).toHaveProperty('disabled', true)
		fireEvent.click(screen.getByRole('radio', { name: 'Баг' }))
		expect(onChange).not.toHaveBeenCalled()
		expect(screen.getByRole('radio', { name: 'Задача', checked: true })).toBeDefined()
	})
})
