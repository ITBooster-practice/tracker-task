import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Link from 'next/link'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SidebarSelector } from '@/widgets/main-layout/ui/sidebar/sidebar-selector'

const options = [
	{ id: '1', name: 'Alpha', shortName: 'AL' },
	{ id: '2', name: 'Beta', shortName: 'BE' },
]
const defaultProps = {
	label: 'Команда',
	value: 'Alpha',
	shortValue: 'AL',
	options,
	activeId: '1',
	isOpen: true,
	onSelect: vi.fn(),
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	)
	vi.stubGlobal('PointerEvent', MouseEvent)
})
afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
})

describe('SidebarSelector', () => {
	it.each([true, false])(
		'selects an option using the keyboard trigger (expanded: %s)',
		async (isOpen) => {
			const onSelect = vi.fn()
			render(<SidebarSelector {...defaultProps} isOpen={isOpen} onSelect={onSelect} />)
			const button = screen.getByRole('button', { name: 'Команда: Alpha' })
			fireEvent.keyDown(button, { key: 'ArrowDown' })
			await screen.findByRole('menu')
			expect(screen.getAllByRole('menuitem')).toHaveLength(2)
			fireEvent.click(screen.getByRole('menuitem', { name: 'Beta' }))
			await waitFor(() => expect(onSelect).toHaveBeenCalledWith('2'))
		},
	)

	it('keeps the expanded placeholder and disabled explanation visible', () => {
		render(
			<SidebarSelector
				{...defaultProps}
				disabled
				value=''
				placeholder='Выберите команду'
			/>,
		)
		expect(screen.getByText('Выберите команду')).toBeDefined()
		expect(screen.queryByRole('button')).toBeNull()
	})

	it('retains the confirmed selection while options are empty or loading', () => {
		render(<SidebarSelector {...defaultProps} options={[]} loading />)
		expect(screen.getByText('Alpha')).toBeDefined()
		expect(screen.queryByText('Нет элементов')).toBeNull()
	})

	it('shows the empty state without a dropdown', () => {
		render(
			<SidebarSelector {...defaultProps} value='' options={[]} emptyLabel='Нет команд' />,
		)
		expect(screen.getByText('Нет команд')).toBeDefined()
		expect(screen.queryByRole('menu')).toBeNull()
	})

	it.each(['hover', 'focus'])(
		'explains a collapsed selector on %s without a native title',
		async (event) => {
			const { container } = render(<SidebarSelector {...defaultProps} isOpen={false} />)
			const button = screen.getByRole('button', { name: 'Команда: Alpha' })
			expect(screen.getByText('AL')).toBeDefined()
			expect(container.querySelector('[title]')).toBeNull()
			if (event === 'hover') fireEvent.pointerMove(button, { pointerType: 'mouse' })
			else fireEvent.focus(button)
			expect((await screen.findByRole('tooltip')).textContent).toContain('Команда: Alpha')
		},
	)

	it.each([false, true])(
		'explains an unavailable selector without permitting selection (disabled: %s)',
		async (disabled) => {
			const onSelect = vi.fn()
			render(
				<SidebarSelector
					{...defaultProps}
					label='Проект'
					isOpen={false}
					value=''
					options={disabled ? options : []}
					disabled={disabled}
					disabledReason='Сначала выберите команду'
					placeholder='Выберите проект'
					emptyLabel='Нет проектов'
					onSelect={onSelect}
				/>,
			)
			const button = screen.getByRole('button', { name: 'Проект: Выберите проект' })
			expect(button.getAttribute('aria-disabled')).toBe('true')
			button.focus()
			expect(document.activeElement).toBe(button)
			fireEvent.focus(button)
			expect((await screen.findByRole('tooltip')).textContent).toContain(
				disabled ? 'Сначала выберите команду' : 'Нет проектов',
			)
			fireEvent.keyDown(button, { key: 'ArrowDown' })
			fireEvent.click(button)
			expect(screen.queryByRole('menu')).toBeNull()
			expect(onSelect).not.toHaveBeenCalled()
		},
	)

	it('hides the tooltip while the dropdown is open and leaves outside actions available', async () => {
		const outsideAction = vi.fn()
		render(
			<>
				<SidebarSelector {...defaultProps} isOpen={false} />
				<Link
					href='/teams'
					onClick={(event) => {
						event.preventDefault()
						outsideAction()
					}}
				>
					Команды
				</Link>
			</>,
		)
		const button = screen.getByRole('button', { name: 'Команда: Alpha' })
		fireEvent.focus(button)
		await screen.findByRole('tooltip')
		fireEvent.keyDown(button, { key: 'ArrowDown' })
		await screen.findByRole('menu')
		await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
		expect(document.body.style.pointerEvents).not.toBe('none')
		fireEvent.click(screen.getByRole('link', { name: 'Команды' }))
		expect(outsideAction).toHaveBeenCalledOnce()
	})

	it('closes an open menu when the display mode or availability changes', async () => {
		const { rerender } = render(<SidebarSelector {...defaultProps} isOpen={false} />)
		fireEvent.keyDown(screen.getByRole('button', { name: 'Команда: Alpha' }), {
			key: 'ArrowDown',
		})
		await screen.findByRole('menu')
		rerender(
			<SidebarSelector
				{...defaultProps}
				isOpen={false}
				disabled
				disabledReason='Нет доступа'
			/>,
		)
		await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
		fireEvent.focus(screen.getByRole('button', { name: 'Команда: Alpha' }))
		expect((await screen.findByRole('tooltip')).textContent).toContain('Нет доступа')
		rerender(<SidebarSelector {...defaultProps} />)
		expect(screen.queryByRole('menu')).toBeNull()
	})
})
