import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarSelector } from '@/widgets/main-layout/ui/sidebar/sidebar-selector'

vi.mock('@repo/ui', () => ({
	cn: (...args: (string | false | undefined)[]) => args.filter(Boolean).join(' '),
	DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DropdownMenuTrigger: ({
		children,
		disabled,
	}: React.PropsWithChildren<{ asChild?: boolean; disabled?: boolean }>) => (
		<div data-testid='trigger' data-disabled={disabled}>
			{children}
		</div>
	),
	DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
		<div data-testid='content'>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onSelect,
	}: React.PropsWithChildren<{ onSelect?: () => void; className?: string }>) => (
		<div data-testid='menu-item' onClick={onSelect}>
			{children}
		</div>
	),
	DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('@repo/ui/icons', () => ({
	ChevronDown: () => <span data-testid='chevron' />,
}))

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

afterEach(cleanup)

describe('SidebarSelector — expanded (isOpen=true)', () => {
	it('показывает label и value', () => {
		render(<SidebarSelector {...defaultProps} />)

		expect(screen.getByText('Команда')).toBeDefined()
		expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
	})

	it('показывает placeholder когда value пустой', () => {
		render(<SidebarSelector {...defaultProps} value='' placeholder='Выберите команду' />)

		expect(screen.getByText('Выберите команду')).toBeDefined()
	})

	it('показывает emptyLabel и не рендерит дропдаун когда нет опций', () => {
		render(<SidebarSelector {...defaultProps} options={[]} emptyLabel='Нет команд' />)

		expect(screen.getByText('Нет команд')).toBeDefined()
		expect(screen.queryByTestId('content')).toBeNull()
	})

	it('показывает placeholder когда disabled=true', () => {
		render(
			<SidebarSelector {...defaultProps} disabled={true} placeholder='Выберите проект' />,
		)

		expect(screen.getByText('Выберите проект')).toBeDefined()
		expect(screen.queryByTestId('content')).toBeNull()
	})

	it('показывает все опции в списке', () => {
		render(<SidebarSelector {...defaultProps} />)

		expect(screen.getAllByTestId('menu-item')).toHaveLength(2)
		expect(screen.getByText('Beta')).toBeDefined()
	})

	it('вызывает onSelect при клике на опцию', () => {
		const onSelect = vi.fn()
		render(<SidebarSelector {...defaultProps} onSelect={onSelect} />)

		screen.getAllByTestId('menu-item')[1]!.click()

		expect(onSelect).toHaveBeenCalledWith('2')
	})
})

describe('SidebarSelector — collapsed (isOpen=false)', () => {
	it('показывает shortValue в кнопке', () => {
		render(<SidebarSelector {...defaultProps} isOpen={false} />)

		expect(screen.getByText('AL')).toBeDefined()
	})

	it('кнопка задизейблена когда нет опций', () => {
		render(<SidebarSelector {...defaultProps} isOpen={false} options={[]} />)

		const button = screen.getByRole('button')
		expect(button.hasAttribute('disabled')).toBe(true)
	})

	it('кнопка задизейблена когда disabled=true', () => {
		render(<SidebarSelector {...defaultProps} isOpen={false} disabled={true} />)

		const button = screen.getByRole('button')
		expect(button.hasAttribute('disabled')).toBe(true)
	})

	it('кнопка активна когда есть опции и не disabled', () => {
		render(<SidebarSelector {...defaultProps} isOpen={false} />)

		const button = screen.getByRole('button')
		expect(button.hasAttribute('disabled')).toBe(false)
	})
})
