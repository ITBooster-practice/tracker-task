import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TaskPriorityBadge } from '@/entities/task/ui/task-priority-badge'
import { TaskStatusBadge } from '@/entities/task/ui/task-status-badge'
import { TaskTypeBadge } from '@/entities/task/ui/task-type-badge'

// ─── Мок: @repo/ui ───────────────────────────────────────────────
// Tooltip рендерит контент сразу (без hover), чтобы тест мог проверить label.
vi.mock('@repo/ui', () => ({
	Badge: ({
		children,
		className,
	}: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
		<span className={className}>{children}</span>
	),
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
	Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
	TooltipContent: ({ children }: React.PropsWithChildren) => (
		<div data-testid='tooltip-content'>{children}</div>
	),
	TooltipProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
	TooltipTrigger: ({
		children,
	}: React.PropsWithChildren<{ asChild?: boolean; className?: string }>) => (
		<div data-testid='tooltip-trigger'>{children}</div>
	),
}))

vi.mock('@repo/ui/icons', () => ({
	AlertTriangle: () => <span data-testid='icon-alert' />,
	ArrowDown: () => <span data-testid='icon-arrow-down' />,
	ArrowUp: () => <span data-testid='icon-arrow-up' />,
	Minus: () => <span data-testid='icon-minus' />,
}))

afterEach(cleanup)

// ─── TaskStatusBadge ─────────────────────────────────────────────
describe('TaskStatusBadge', () => {
	it.each([
		['TODO', 'К выполнению'],
		['IN_PROGRESS', 'В работе'],
		['IN_REVIEW', 'Ревью'],
		['DONE', 'Готово'],
	] as const)('статус %s → отображает "%s"', (status, label) => {
		render(<TaskStatusBadge status={status} />)

		expect(screen.getByText(label)).toBeDefined()

		cleanup()
	})
})

// ─── TaskTypeBadge ───────────────────────────────────────────────
describe('TaskTypeBadge', () => {
	it.each(['Эпик', 'Стори', 'Баг', 'Тех. долг', 'Задача'] as const)(
		'тип "%s" → рендерит текст типа',
		(type) => {
			render(<TaskTypeBadge type={type} />)

			expect(screen.getByText(type)).toBeDefined()

			cleanup()
		},
	)
})

// ─── TaskPriorityBadge ───────────────────────────────────────────
describe('TaskPriorityBadge', () => {
	it.each([
		['LOW', 'icon-arrow-down', 'Низкий'],
		['MEDIUM', 'icon-minus', 'Средний'],
		['HIGH', 'icon-arrow-up', 'Высокий'],
		['CRITICAL', 'icon-alert', 'Критичный'],
	] as const)('приоритет %s → иконка %s и тултип "%s"', (priority, iconTestId, label) => {
		render(<TaskPriorityBadge priority={priority} />)

		expect(screen.getByTestId(iconTestId)).toBeDefined()
		expect(screen.getByTestId('tooltip-content')).toBeDefined()
		expect(screen.getByText(label)).toBeDefined()

		cleanup()
	})
})
