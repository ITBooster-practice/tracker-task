import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Link from 'next/link'
import { afterEach, expect, it } from 'vitest'

import { EmptyState } from '@repo/ui'

import { PageHeader } from '@/shared/ui/page-header'

afterEach(cleanup)

it('собирает шапку страницы с описанием, навигацией и действиями без второго h1 в состоянии контента', () => {
	let activated = false
	render(
		<>
			<PageHeader
				title='Мой проект'
				description='Проект Tracker Task'
				navigation={
					<nav aria-label='Хлебные крошки'>
						<Link href='/teams'>Команды</Link>
					</nav>
				}
				actions={
					<button
						onClick={() => {
							activated = true
						}}
					>
						Создать
					</button>
				}
			/>
			<EmptyState headingLevel='h2' title='Пока нет данных' />
		</>,
	)
	expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
	expect(screen.getByRole('heading', { name: 'Мой проект', level: 1 })).toBeDefined()
	expect(screen.getByText('Проект Tracker Task')).toBeDefined()
	expect(screen.getByRole('navigation', { name: 'Хлебные крошки' })).toBeDefined()
	expect(screen.getByRole('heading', { name: 'Пока нет данных', level: 2 })).toBeDefined()
	fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
	expect(activated).toBe(true)
})
