import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CtaSection } from '@/views/home/ui/cta-section'
import { DeploySection } from '@/views/home/ui/deploy-section'
import { FeaturesSection } from '@/views/home/ui/features-section'
import { HeroSection } from '@/views/home/ui/hero-section'
import { HomeFooter } from '@/views/home/ui/home-footer'
import { HomeHeader } from '@/views/home/ui/home-header'
import { HomePage } from '@/views/home/ui/home-page'

// ─── Мок: next/link ──────────────────────────────────────────────
vi.mock('next/link', () => ({
	default: ({
		href,
		children,
		className,
	}: React.PropsWithChildren<{ href: string; className?: string }>) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}))

// ─── Мок: @repo/ui ───────────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		asChild,
		...props
	}: React.PropsWithChildren<{
		asChild?: boolean
		variant?: string
		size?: string
		className?: string
	}>) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
}))

// ─── Мок: @repo/ui/icons (все иконки, используемые home-модулем) ─
vi.mock('@repo/ui/icons', () => ({
	BookOpen: () => <span data-testid='icon-book-open' />,
	Brain: () => <span data-testid='icon-brain' />,
	CheckCircle2: () => <span data-testid='icon-check' />,
	Github: () => <span data-testid='icon-github' />,
	KanbanSquare: () => <span data-testid='icon-kanban' />,
	Play: () => <span data-testid='icon-play' />,
	Radio: () => <span data-testid='icon-radio' />,
	Server: () => <span data-testid='icon-server' />,
	Shield: () => <span data-testid='icon-shield' />,
	Terminal: () => <span data-testid='icon-terminal' />,
	Users: () => <span data-testid='icon-users' />,
	Zap: () => <span data-testid='icon-zap' />,
}))

// ─── Мок: @/shared/config ────────────────────────────────────────
vi.mock('@/shared/config', () => ({
	ROUTES: {
		login: '/login',
		teams: '/teams',
	},
}))

afterEach(cleanup)

// ─── HomeHeader ──────────────────────────────────────────────────
describe('HomeHeader', () => {
	it('рендерит бренд "Tracker Task"', () => {
		render(<HomeHeader />)

		expect(screen.getByText('Tracker Task')).toBeDefined()
	})

	it('рендерит навигационные ссылки из content', () => {
		render(<HomeHeader />)

		expect(screen.getByText('Возможности')).toBeDefined()
		expect(screen.getByText('Установка')).toBeDefined()
		expect(screen.getByText('Сообщество')).toBeDefined()
	})

	it('рендерит кнопку "Войти" со ссылкой на /login', () => {
		render(<HomeHeader />)

		const loginLink = screen.getByRole('link', { name: /войти/i })
		expect(loginLink).toBeDefined()
		expect(loginLink.getAttribute('href')).toBe('/login')
	})
})

// ─── HomeFooter ──────────────────────────────────────────────────
describe('HomeFooter', () => {
	it('рендерит брендовый текст', () => {
		render(<HomeFooter />)

		expect(screen.getByText('Tracker Task — open-source task tracker')).toBeDefined()
	})

	it('рендерит ссылку на GitHub из footerLinks', () => {
		render(<HomeFooter />)

		expect(screen.getByRole('link', { name: 'GitHub' })).toBeDefined()
	})
})

// ─── HeroSection ─────────────────────────────────────────────────
describe('HeroSection', () => {
	it('рендерит главный заголовок', () => {
		render(<HeroSection />)

		expect(screen.getByText(/трекер задач для команд/i)).toBeDefined()
	})

	it('рендерит badge "Open Source & Self-Hosted"', () => {
		render(<HeroSection />)

		expect(screen.getByText('Open Source & Self-Hosted')).toBeDefined()
	})
})

// ─── FeaturesSection ─────────────────────────────────────────────
describe('FeaturesSection', () => {
	it('рендерит заголовок секции', () => {
		render(<FeaturesSection />)

		expect(screen.getByText('Всё, что нужно для работы')).toBeDefined()
	})

	it('рендерит feature-карточки из content', () => {
		render(<FeaturesSection />)

		expect(screen.getByText('Свой сервер')).toBeDefined()
		expect(screen.getByText('Kanban-first')).toBeDefined()
		expect(screen.getByText('AI-помощник')).toBeDefined()
	})
})

// ─── CtaSection ──────────────────────────────────────────────────
describe('CtaSection', () => {
	it('рендерит заголовок "Открытый код"', () => {
		render(<CtaSection />)

		expect(screen.getByText('Открытый код')).toBeDefined()
	})

	it('рендерит action-ссылки из communityActions', () => {
		render(<CtaSection />)

		expect(screen.getByText('Дорожная карта')).toBeDefined()
		expect(screen.getByText('Как внести вклад')).toBeDefined()
	})
})

// ─── DeploySection ───────────────────────────────────────────────
describe('DeploySection', () => {
	it('рендерит заголовок "Развернуть за 4 шага"', () => {
		render(<DeploySection />)

		expect(screen.getByText('Развернуть за 4 шага')).toBeDefined()
	})

	it('рендерит шаги деплоя с кодом', () => {
		render(<DeploySection />)

		expect(screen.getByText(/docker compose up/)).toBeDefined()
	})
})

// ─── HomePage ────────────────────────────────────────────────────
describe('HomePage', () => {
	it('рендерится без ошибок и содержит основные секции', () => {
		render(<HomePage />)

		// Верхний уровень и наличие ключевых секций
		expect(screen.getByText('Tracker Task')).toBeDefined()
		expect(screen.getByText(/трекер задач для команд/i)).toBeDefined()
		expect(screen.getByText('Всё, что нужно для работы')).toBeDefined()
	})
})
