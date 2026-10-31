import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project, Team, TeamRole, User } from '@repo/types'

import { SidebarUser } from '@/widgets/main-layout/ui/sidebar/sidebar-user'

const queries = vi.hoisted(() => ({
	profile: vi.fn(),
	team: vi.fn(),
	project: vi.fn(),
	logout: vi.fn(),
}))
vi.mock('next/link', () => ({
	default: ({ onClick, ...props }: React.ComponentProps<'a'>) => (
		<a
			{...props}
			onClick={(event) => {
				event.preventDefault()
				onClick?.(event)
			}}
		/>
	),
}))
vi.mock('@/features/auth', () => ({
	LogoutButton: () => <button aria-label='Выйти' onClick={queries.logout} />,
}))
vi.mock('@/shared/api/use-auth', () => ({ useMe: queries.profile }))
vi.mock('@/shared/api/use-teams', () => ({ useTeamDetail: queries.team }))
vi.mock('@/shared/api/use-projects', () => ({ useProjectDetail: queries.project }))

const user: User = { id: 'user-1', name: 'Ирина Иванова', email: 'irina@example.test' }
const makeTeam = (id = 'team-1', role: TeamRole = 'OWNER'): Team => ({
	id,
	name: `Команда ${id}`,
	description: null,
	avatarUrl: null,
	members: [
		{
			id: 'member-1',
			userId: user.id,
			name: user.name,
			email: user.email,
			role,
			joinedAt: '',
		},
	],
	createdAt: '',
	updatedAt: '',
})
const makeProject = (id = 'project-1', teamId = 'team-1'): Project => ({
	id,
	teamId,
	name: `Проект ${id}`,
	description: null,
	createdById: user.id,
	createdAt: '',
	updatedAt: '',
})
const props = {
	teamId: 'team-1',
	projectId: 'project-1',
	isOpen: true,
}

describe('SidebarUser', () => {
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
		queries.profile.mockReturnValue({ data: user })
		queries.team.mockReturnValue({ data: makeTeam() })
		queries.project.mockReturnValue({ data: makeProject() })
	})
	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})

	it.each([true, false])(
		'keeps profile navigation separate from logout (expanded: %s)',
		(isOpen) => {
			const onNavigate = vi.fn()
			render(<SidebarUser {...props} isOpen={isOpen} onNavigate={onNavigate} />)
			const links = screen.getAllByRole('link', { name: 'Личный кабинет' })
			expect(links).toHaveLength(isOpen ? 2 : 1)
			for (const link of links) {
				expect(link.getAttribute('href')).toBe('/profile')
				link.focus()
				expect(document.activeElement).toBe(link)
				fireEvent.click(link)
			}
			expect(onNavigate).toHaveBeenCalledTimes(links.length)
			expect(queries.logout).not.toHaveBeenCalled()
			const logout = screen.getByRole('button', { name: 'Выйти' })
			expect(logout.closest('a')).toBeNull()
			expect(screen.getByText('Владелец').closest('a, button')).toBeNull()
			fireEvent.click(logout)
			expect(queries.logout).toHaveBeenCalledOnce()
			expect(onNavigate).toHaveBeenCalledTimes(links.length)
		},
	)

	it.each([
		['OWNER', 'Владелец', 'owner'],
		['ADMIN', 'Администратор', 'admin'],
		['MEMBER', 'Участник', 'member'],
	] as const)('показывает роль %s из команды выбранного проекта', (role, label, tone) => {
		queries.team.mockReturnValue({ data: makeTeam('team-1', role) })
		render(<SidebarUser {...props} />)

		expect(screen.getByText(user.name!)).toBeDefined()
		expect(
			screen.getByText(label).closest('[data-slot="badge"]')?.getAttribute('data-tone'),
		).toBe(tone)
		expect(screen.getByText(label).closest('[title]')?.getAttribute('title')).toContain(
			'доступ к проекту «Проект project-1»',
		)
		expect(queries.team).toHaveBeenCalledWith('team-1', {
			accountId: 'user-1',
			enabled: true,
		})
		expect(queries.project).toHaveBeenCalledWith('team-1', 'project-1', {
			accountId: 'user-1',
			enabled: true,
		})
	})

	it('явно называет командную роль вне проекта', () => {
		render(<SidebarUser {...props} projectId={null} />)
		expect(screen.getByText('Владелец').closest('[title]')?.getAttribute('title')).toBe(
			'Владелец команды «Команда team-1»',
		)
		expect(queries.project).toHaveBeenCalledWith('team-1', '', {
			accountId: 'user-1',
			enabled: true,
		})
	})

	it('не выдаёт прежнюю роль за права на экране без контекста команды', () => {
		render(<SidebarUser {...props} teamId={null} projectId={null} />)
		expect(screen.getByText('Роль не определена')).toBeDefined()
		expect(
			screen
				.getByText('Роль не определена')
				.closest('[data-slot="badge"]')
				?.hasAttribute('data-tone'),
		).toBe(false)
		expect(screen.queryByText('Владелец')).toBeNull()
		expect(queries.team).toHaveBeenCalledWith('', { accountId: 'user-1', enabled: true })
	})

	it('сбрасывает прошлую роль при смене команды и проекта до загрузки нового контекста', () => {
		const { rerender } = render(<SidebarUser {...props} />)
		expect(screen.getByText('Владелец')).toBeDefined()

		rerender(<SidebarUser {...props} teamId='team-2' projectId='project-2' />)
		expect(screen.getByText('Роль не определена')).toBeDefined()

		queries.team.mockReturnValue({ data: makeTeam('team-2', 'MEMBER') })
		queries.project.mockReturnValue({ data: makeProject('project-2', 'team-2') })
		rerender(<SidebarUser {...props} teamId='team-2' projectId='project-2' />)

		expect(screen.getByText('Участник')).toBeDefined()
		expect(screen.queryByText('Владелец')).toBeNull()
	})

	it('не использует проект из старого ответа другой команды', () => {
		queries.project.mockReturnValue({ data: makeProject('project-1', 'team-2') })
		render(<SidebarUser {...props} />)
		expect(screen.getByText('Роль не определена')).toBeDefined()
	})

	it.each(['isPending', 'isFetching', 'isError'])(
		'не показывает закэшированную роль команды при %s',
		(flag) => {
			queries.team.mockReturnValue({ data: makeTeam(), [flag]: true })
			render(<SidebarUser {...props} />)
			expect(screen.getByText('Роль не определена')).toBeDefined()
		},
	)

	it.each(['isPending', 'isFetching', 'isError'])(
		'не показывает права проекта при %s',
		(flag) => {
			queries.project.mockReturnValue({ data: makeProject(), [flag]: true })
			render(<SidebarUser {...props} />)
			expect(screen.getByText('Роль не определена')).toBeDefined()
		},
	)

	it('не придумывает роль при отсутствии членства пользователя', () => {
		queries.team.mockReturnValue({ data: { ...makeTeam(), members: [] } })
		render(<SidebarUser {...props} />)
		expect(screen.getByText('Роль не определена')).toBeDefined()
	})

	it('использует нейтральное имя и роль при загрузке профиля', () => {
		queries.profile.mockReturnValue({ isPending: true })
		const { container } = render(<SidebarUser {...props} />)
		expect(screen.getByText('Пользователь')).toBeDefined()
		expect(screen.getByText('Роль не определена')).toBeDefined()
		expect(
			container.querySelector('[data-slot="user-summary"]')?.getAttribute('aria-busy'),
		).toBe('true')
		expect(screen.queryByText('Алексей Иванов')).toBeNull()
	})

	it('показывает email и инициалы при отсутствии имени', () => {
		queries.profile.mockReturnValue({ data: { ...user, name: null } })
		render(<SidebarUser {...props} />)
		expect(screen.getByText(user.email)).toBeDefined()
	})

	it('сохраняет имя и роль для скринридера в свёрнутом меню', async () => {
		const { container } = render(<SidebarUser {...props} isOpen={false} />)
		expect(screen.getByText(user.name!).parentElement?.className).toBe('sr-only')
		expect(container.querySelector('[title]')).toBeNull()
		fireEvent.focus(screen.getByRole('link', { name: 'Личный кабинет' }))
		expect((await screen.findByRole('tooltip')).textContent).toContain(user.name)
		expect(screen.getByText('Владелец')).toBeDefined()
	})
})
