import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TeamCardModel } from '@/views/teams/model/types'
import { TeamCard } from '@/views/teams/ui/team-card'

vi.mock('@repo/ui', () => ({
	Avatar: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div {...props}>{children}</div>
	),
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	ArrowRight: () => <span data-testid='arrow-icon' />,
	FolderKanban: () => <span data-testid='folder-icon' />,
	Users: () => <span data-testid='users-icon' />,
}))

const createMember = (id: string, name: string) => ({
	id,
	name,
	avatar: name.slice(0, 2).toUpperCase(),
	role: 'member' as const,
})

const createTeam = (overrides?: Partial<TeamCardModel>): TeamCardModel => ({
	id: '1',
	name: 'Dream Team',
	projectCount: 3,
	members: [createMember('m1', 'Alice'), createMember('m2', 'Bob')],
	...overrides,
})

describe('TeamCard', () => {
	let onOpen: ReturnType<typeof vi.fn<(team: TeamCardModel) => void>>

	beforeEach(() => {
		onOpen = vi.fn()
	})

	afterEach(cleanup)

	it('отображает название команды', () => {
		render(<TeamCard team={createTeam()} onOpen={onOpen} />)

		expect(screen.getByText('Dream Team')).toBeDefined()
	})

	it('отображает количество участников и проектов', () => {
		render(<TeamCard team={createTeam()} onOpen={onOpen} />)

		expect(screen.getByText(/2 участников/)).toBeDefined()
		expect(screen.getByText(/3 проектов/)).toBeDefined()
	})

	it('клик вызывает onOpen с данными команды', () => {
		const team = createTeam()

		render(<TeamCard team={team} onOpen={onOpen} />)
		fireEvent.click(screen.getByRole('button'))

		expect(onOpen).toHaveBeenCalledOnce()
		expect(onOpen).toHaveBeenCalledWith(
			expect.objectContaining({ id: '1', name: 'Dream Team' }),
		)
	})

	// ─── Аватары: показываем максимум 4 ───────────────────────────
	// Код делает team.members.slice(0, 4) — показывает первые 4.
	// Проверяем, что при 3 участниках рендерятся все 3.

	it('рендерит аватары участников', () => {
		const team = createTeam({
			members: [
				createMember('1', 'Alice'),
				createMember('2', 'Bob'),
				createMember('3', 'Charlie'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.getByText('AL')).toBeDefined()
		expect(screen.getByText('BO')).toBeDefined()
		expect(screen.getByText('CH')).toBeDefined()
	})

	it('показывает "+N" при больше 4 участниках', () => {
		const team = createTeam({
			members: [
				createMember('1', 'A'),
				createMember('2', 'B'),
				createMember('3', 'C'),
				createMember('4', 'D'),
				createMember('5', 'E'),
				createMember('6', 'F'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.getByText('+2')).toBeDefined()
	})

	it('НЕ показывает "+N" при ровно 4 участниках', () => {
		const team = createTeam({
			members: [
				createMember('1', 'A'),
				createMember('2', 'B'),
				createMember('3', 'C'),
				createMember('4', 'D'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.queryByText(/\+\d/)).toBeNull()
	})
})
