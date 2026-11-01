import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TaskAssigneeChoices } from '@/features/tasks/ui/task-assignee-choices'

afterEach(cleanup)

const members = Array.from({ length: 15 }, (_, index) => ({
	userId: `user-${index + 1}`,
	name: `Участник ${index + 1}`,
}))

function Example() {
	const [value, setValue] = useState<string | null>(null)
	return (
		<TaskAssigneeChoices
			value={value}
			onChange={setValue}
			onBlur={() => {}}
			inputRef={() => {}}
			members={members}
			disabled={false}
		/>
	)
}

describe('task assignee choices', () => {
	it('expands beyond ten members and keeps the chosen member visible when collapsed', () => {
		render(<Example />)
		expect(screen.getAllByRole('radio')).toHaveLength(11)
		fireEvent.click(screen.getByRole('button', { name: 'Показать всех (15)' }))
		expect(screen.getAllByRole('radio')).toHaveLength(16)
		fireEvent.click(screen.getByRole('radio', { name: 'Участник 15' }))
		fireEvent.click(screen.getByRole('button', { name: 'Свернуть список' }))
		expect(screen.getAllByRole('radio')).toHaveLength(11)
		expect(
			screen.getByRole('radio', { name: 'Участник 15', checked: true }),
		).toBeDefined()
		expect(
			screen
				.getByRole('button', { name: 'Показать всех (15)' })
				.getAttribute('aria-expanded'),
		).toBe('false')
		fireEvent.click(screen.getByRole('radio', { name: 'Без исполнителя' }))
		expect(
			screen.getByRole('radio', { name: 'Без исполнителя', checked: true }),
		).toBeDefined()
	})
	it.each([0, 10])('shows all %i members without an expansion action', (count) => {
		render(
			<TaskAssigneeChoices
				value={null}
				onChange={vi.fn()}
				onBlur={vi.fn()}
				inputRef={null}
				members={members.slice(0, count)}
				disabled={false}
			/>,
		)
		expect(screen.getAllByRole('radio')).toHaveLength(count + 1)
		expect(screen.queryByRole('button', { name: /Показать всех/ })).toBeNull()
	})
	it('preserves a preselected member past the limit and disables changes while loading', () => {
		const onChange = vi.fn()
		render(
			<TaskAssigneeChoices
				value='user-15'
				onChange={onChange}
				onBlur={vi.fn()}
				inputRef={null}
				members={members}
				disabled
			/>,
		)
		expect(
			screen.getByRole('radio', { name: 'Участник 15', checked: true }),
		).toBeDefined()
		for (const radio of screen.getAllByRole('radio'))
			expect(radio).toHaveProperty('disabled', true)
		fireEvent.click(screen.getByRole('radio', { name: 'Участник 1' }))
		expect(onChange).not.toHaveBeenCalled()
		expect(screen.getByRole('button', { name: 'Показать всех (15)' })).toHaveProperty(
			'disabled',
			true,
		)
	})
})
