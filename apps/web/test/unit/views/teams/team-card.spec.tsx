import { createTeamCardModel, createTeamMember } from '@/test/mocks/team-card.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/test/mocks/team-card-ui.mock'

import { TeamCard } from '@/views/teams/ui/team-card'

describe('TeamCard', () => {
	let onOpen: ReturnType<typeof vi.fn>

	beforeEach(() => {
		onOpen = vi.fn()
	})

	afterEach(cleanup)

	it('отображает название команды', () => {
		render(<TeamCard team={createTeamCardModel()} onOpen={onOpen} />)

		expect(screen.getByText('Dream Team')).toBeDefined()
	})

	it('рендерит badge с числом участников', () => {
		render(<TeamCard team={createTeamCardModel()} onOpen={onOpen} />)

		expect(screen.getByText(/2 участников/)).toBeDefined()
	})

	it('отображает количество проектов', () => {
		render(<TeamCard team={createTeamCardModel()} onOpen={onOpen} />)

		expect(screen.getByText(/3 проектов/)).toBeDefined()
	})

	it('клик вызывает onOpen с данными команды', () => {
		const team = createTeamCardModel()

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

	it('нет участников → аватары не рендерятся', () => {
		const team = createTeamCardModel({ members: [] })

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.queryAllByTestId('team-member-avatar')).toHaveLength(0)
	})

	it('1 участник → рендерится ровно 1 аватар', () => {
		const team = createTeamCardModel({
			members: [createTeamMember('1', 'Alice')],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.getAllByTestId('team-member-avatar')).toHaveLength(1)
	})

	it('3 участника → рендерятся 3 аватара', () => {
		const team = createTeamCardModel({
			members: [
				createTeamMember('1', 'Alice'),
				createTeamMember('2', 'Bob'),
				createTeamMember('3', 'Charlie'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.getAllByTestId('team-member-avatar')).toHaveLength(3)
	})

	it('показывает "+N" при больше 4 участниках', () => {
		const team = createTeamCardModel({
			members: [
				createTeamMember('1', 'A'),
				createTeamMember('2', 'B'),
				createTeamMember('3', 'C'),
				createTeamMember('4', 'D'),
				createTeamMember('5', 'E'),
				createTeamMember('6', 'F'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.getByText('+2')).toBeDefined()
	})

	it('НЕ показывает "+N" при ровно 4 участниках', () => {
		const team = createTeamCardModel({
			members: [
				createTeamMember('1', 'A'),
				createTeamMember('2', 'B'),
				createTeamMember('3', 'C'),
				createTeamMember('4', 'D'),
			],
		})

		render(<TeamCard team={team} onOpen={onOpen} />)

		expect(screen.queryByText(/\+\d/)).toBeNull()
	})
})
