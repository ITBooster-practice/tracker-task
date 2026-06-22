import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	AssigneeSelect,
	PriorityToggle,
	StatusSelect,
	TypeToggle,
} from '@/views/tasks/lib/task-form'

vi.mock('@repo/ui', () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

describe('task-form components', () => {
	afterEach(cleanup)

	describe('TypeToggle', () => {
		it('рендерит все типы задач', () => {
			render(<TypeToggle value='TASK' onChange={() => undefined} />)
			expect(screen.getByText('Задача')).toBeDefined()
			expect(screen.getByText('Баг')).toBeDefined()
			expect(screen.getByText('Стори')).toBeDefined()
			expect(screen.getByText('Эпик')).toBeDefined()
			expect(screen.getByText('Техдолг')).toBeDefined()
		})

		it('вызывает onChange при клике на тип', () => {
			const onChange = vi.fn()
			render(<TypeToggle value='TASK' onChange={onChange} />)
			fireEvent.click(screen.getByText('Баг'))
			expect(onChange).toHaveBeenCalledWith('BUG')
		})

		it('выбранный тип выделен', () => {
			render(<TypeToggle value='EPIC' onChange={() => undefined} />)
			const epicBtn = screen.getByText('Эпик').closest('button')!
			expect(epicBtn.className).toContain('border-primary')
		})
	})

	describe('PriorityToggle', () => {
		it('рендерит все приоритеты', () => {
			render(<PriorityToggle value='MEDIUM' onChange={() => undefined} />)
			expect(screen.getByText('Критический')).toBeDefined()
			expect(screen.getByText('Высокий')).toBeDefined()
			expect(screen.getByText('Средний')).toBeDefined()
			expect(screen.getByText('Низкий')).toBeDefined()
		})

		it('вызывает onChange при выборе приоритета', () => {
			const onChange = vi.fn()
			render(<PriorityToggle value='MEDIUM' onChange={onChange} />)
			fireEvent.click(screen.getByText('Высокий'))
			expect(onChange).toHaveBeenCalledWith('HIGH')
		})
	})

	describe('StatusSelect', () => {
		it('рендерит все доступные статусы', () => {
			render(<StatusSelect value='TODO' onChange={() => undefined} />)
			expect(screen.getByText('To Do')).toBeDefined()
			expect(screen.getByText('In Progress')).toBeDefined()
			expect(screen.getByText('Review')).toBeDefined()
			expect(screen.getByText('Done')).toBeDefined()
		})

		it('вызывает onChange при смене статуса', () => {
			const onChange = vi.fn()
			render(<StatusSelect value='TODO' onChange={onChange} />)
			fireEvent.change(screen.getByRole('combobox'), {
				target: { value: 'IN_PROGRESS' },
			})
			expect(onChange).toHaveBeenCalledWith('IN_PROGRESS')
		})
	})

	describe('AssigneeSelect', () => {
		const members = [
			{ userId: 'user-1', name: 'Иван Иванов' },
			{ userId: 'user-2', name: null },
		]

		it('рендерит участников и вариант без назначения', () => {
			render(<AssigneeSelect value='' members={members} onChange={() => undefined} />)
			expect(screen.getByText('Не назначен')).toBeDefined()
			expect(screen.getByText('Иван Иванов')).toBeDefined()
			expect(screen.getByText('user-2')).toBeDefined()
		})

		it('вызывает onChange при выборе исполнителя', () => {
			const onChange = vi.fn()
			render(<AssigneeSelect value='' members={members} onChange={onChange} />)
			fireEvent.change(screen.getByRole('combobox'), {
				target: { value: 'user-1' },
			})
			expect(onChange).toHaveBeenCalledWith('user-1')
		})
	})
})
