import LegacyBoardsRedirectPage from '@/app/(dashboard)/boards/page'
import LegacySprintsRedirectPage from '@/app/(dashboard)/sprints/page'
import { beforeEach, expect, it, vi } from 'vitest'

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect }))

beforeEach(() => {
	redirect.mockReset()
	redirect.mockImplementation((href: string) => {
		throw new Error(`NEXT_REDIRECT:${href}`)
	})
})

it.each([
	['/boards', LegacyBoardsRedirectPage],
	['/sprints', LegacySprintsRedirectPage],
] as const)('%s без контекста проекта ведёт к выбору команды', (_, Page) => {
	expect(() => Page()).toThrow('NEXT_REDIRECT:/teams')
	expect(redirect).toHaveBeenCalledExactlyOnceWith('/teams')
})
