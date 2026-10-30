import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'

import { Sidebar } from '@/widgets/main-layout/ui/sidebar'
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context'

const navigation = vi.hoisted(() => ({ pathname: '/teams/team-1/projects/project-1' }))

vi.mock('next/navigation', () => ({
	usePathname: () => navigation.pathname,
	useParams: () => {
		const parts = navigation.pathname.split('/').filter(Boolean)
		return parts[0] === 'teams'
			? { id: parts[1], projectId: parts[2] === 'projects' ? parts[3] : undefined }
			: {}
	},
	useRouter: () => ({
		push: (href: string) => {
			navigation.pathname = href
		},
	}),
}))
vi.mock('next/link', () => ({
	default: ({
		href,
		onClick,
		...props
	}: React.ComponentProps<'a'> & { href: string }) => (
		<a
			{...props}
			href={href}
			onClick={(event) => {
				onClick?.(event)
				if (!event.defaultPrevented) {
					event.preventDefault()
					navigation.pathname = href
				}
			}}
		/>
	),
}))
vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => ({ data: { name: 'Разработчик' } }),
}))
vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => ({ data: undefined }),
	useTeamsList: () => ({
		data: { data: [{ id: 'team-1', name: 'Команда', currentUserRole: 'OWNER' }] },
	}),
}))
vi.mock('@/shared/api/use-projects', () => ({
	useProjectDetail: () => ({ data: undefined }),
	useProjectsList: () => ({
		data: { data: [{ id: 'project-1', teamId: 'team-1', name: 'Проект' }] },
	}),
}))
vi.mock('@/widgets/main-layout/ui/sidebar/sidebar-selector', () => ({
	SidebarSelector: ({ label, value }: { label: string; value: string }) => (
		<div>
			{label}: {value}
		</div>
	),
}))
const snapshot: FeatureFlagsSnapshot = {
	version: 1,
	flags: Object.values(FEATURE_KEYS).map((key) => ({
		key,
		enabled: true,
		updatedAt: '2026-10-28T00:00:00.000Z',
	})),
}
const Wrapper = ({ children }: React.PropsWithChildren) => (
	<FeatureFlagsContext.Provider
		value={{
			snapshot,
			status: 'ready',
			connection: 'connected',
			canManage: false,
			retry: () => undefined,
		}}
	>
		{children}
	</FeatureFlagsContext.Provider>
)

beforeEach(() => {
	navigation.pathname = '/teams/team-1/projects/project-1'
})
afterEach(cleanup)

it.each([true, false])(
	'сохраняет проект и переключает активный пункт на доску (sidebar открыт: %s)',
	(isOpen) => {
		const { rerender } = render(<Sidebar forceOpen={isOpen} />, { wrapper: Wrapper })
		const board = screen.getByRole('link', { name: 'Доска' })
		expect(
			screen.getByRole('link', { name: 'Обзор проекта' }).getAttribute('aria-current'),
		).toBe('page')
		expect(board.getAttribute('href')).toBe('/teams/team-1/projects/project-1/board')
		fireEvent.click(board)
		rerender(<Sidebar forceOpen={isOpen} />)

		expect(navigation.pathname).toBe('/teams/team-1/projects/project-1/board')
		expect(screen.getByRole('link', { name: 'Доска' }).getAttribute('aria-current')).toBe(
			'page',
		)
		const overview = screen.getByRole('link', { name: 'Обзор проекта' })
		expect(overview.getAttribute('href')).toBe('/teams/team-1/projects/project-1')
		expect(overview.getAttribute('aria-current')).toBeNull()
		expect(screen.getByText('Команда: Команда')).toBeDefined()
		expect(screen.getByText('Проект: Проект')).toBeDefined()
	},
)

it('не уводит на общий экран досок без выбранного проекта', () => {
	navigation.pathname = '/teams/team-1/projects'
	render(<Sidebar forceOpen />, { wrapper: Wrapper })
	const board = screen.getByRole('link', { name: 'Доска' })
	expect(board.getAttribute('aria-disabled')).toBe('true')
	fireEvent.click(board)
	expect(navigation.pathname).toBe('/teams/team-1/projects')
})
