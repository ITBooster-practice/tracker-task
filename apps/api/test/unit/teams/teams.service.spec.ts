import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamsService } from '../../../src/teams/teams.service'
import {
	createPrismaMock,
	USER_ID,
	TEAM_ID,
	TEAM,
	MEMBER_OWNER,
	MEMBER_ADMIN,
	MEMBER_PLAIN,
} from '../../helpers/teams.helpers'

// ── suite ─────────────────────────────────────────────────────────────────────
describe('TeamsService', () => {
	let service: TeamsService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createPrismaMock()
		service = new TeamsService(prisma)
	})

	// ── createTeam ────────────────────────────────────────────────────────────
	describe('createTeam', () => {
		it('должен создать команду и вернуть её с участником OWNER', async () => {
			prisma.team.create.mockResolvedValue(TEAM)

			const result = await service.createTeam(USER_ID, { name: 'Dream Team' })

			expect(prisma.team.create).toHaveBeenCalledOnce()
			expect(prisma.team.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						name: 'Dream Team',
						members: {
							create: { userId: USER_ID, role: 'OWNER' },
						},
					}),
				}),
			)
			expect(result).toEqual(TEAM)
		})

		it('должен создать команду с опциональными полями description и avatarUrl', async () => {
			const teamWithExtras = {
				...TEAM,
				description: 'Описание',
				avatarUrl: 'https://example.com/avatar.png',
			}
			prisma.team.create.mockResolvedValue(teamWithExtras)

			const result = await service.createTeam(USER_ID, {
				name: 'Dream Team',
				description: 'Описание',
				avatarUrl: 'https://example.com/avatar.png',
			})

			expect(result.description).toBe('Описание')
			expect(result.avatarUrl).toBe('https://example.com/avatar.png')
		})
	})

	// ── getUserTeams ──────────────────────────────────────────────────────────
	describe('getUserTeams', () => {
		it('должен вернуть пагинированный список команд с ролью и кол-вом участников', async () => {
			prisma.teamMember.findMany.mockResolvedValue([
				{
					role: 'OWNER',
					team: {
						id: TEAM_ID,
						name: 'Dream Team',
						description: null,
						avatarUrl: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						_count: { members: 3 },
					},
				},
			])
			prisma.teamMember.count.mockResolvedValue(1)

			const result = await service.getUserTeams(USER_ID, { page: 1, limit: 10 })

			expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: USER_ID },
					orderBy: { joinedAt: 'desc' },
					skip: 0,
					take: 10,
				}),
			)
			expect(result).toEqual({
				data: [
					expect.objectContaining({
						id: TEAM_ID,
						name: 'Dream Team',
						membersCount: 3,
						currentUserRole: 'OWNER',
					}),
				],
				meta: {
					page: 1,
					limit: 10,
					total: 1,
					totalPages: 1,
				},
			})
		})

		it('должен вернуть пустой paginated response если пользователь не состоит ни в одной команде', async () => {
			prisma.teamMember.findMany.mockResolvedValue([])
			prisma.teamMember.count.mockResolvedValue(0)

			const result = await service.getUserTeams(USER_ID, { page: 1, limit: 10 })

			expect(result).toEqual({
				data: [],
				meta: {
					page: 1,
					limit: 10,
					total: 0,
					totalPages: 0,
				},
			})
		})
	})

	// ── getTeamById ───────────────────────────────────────────────────────────
	describe('getTeamById', () => {
		it('должен вернуть команду если пользователь является её участником', async () => {
			prisma.team.findUnique.mockResolvedValue(TEAM)

			const result = await service.getTeamById(TEAM_ID, USER_ID)

			expect(prisma.team.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: TEAM_ID } }),
			)
			expect(result).toEqual(TEAM)
		})

		it('должен выбросить NotFoundException если команда не найдена', async () => {
			prisma.team.findUnique.mockResolvedValue(null)

			await expect(service.getTeamById(TEAM_ID, USER_ID)).rejects.toThrow(
				NotFoundException,
			)
			await expect(service.getTeamById(TEAM_ID, USER_ID)).rejects.toThrow(
				'Команда не найдена',
			)
		})

		it('должен выбросить ForbiddenException если пользователь не является участником', async () => {
			prisma.team.findUnique.mockResolvedValue({
				...TEAM,
				members: [
					{
						...MEMBER_PLAIN,
						user: { id: 'user-id-3', name: 'Bob', email: 'bob@example.com' },
					},
				],
			})

			await expect(service.getTeamById(TEAM_ID, USER_ID)).rejects.toThrow(
				ForbiddenException,
			)
			await expect(service.getTeamById(TEAM_ID, USER_ID)).rejects.toThrow(
				'Вы не являетесь участником этой команды',
			)
		})
	})

	// ── updateTeam ────────────────────────────────────────────────────────────
	describe('updateTeam', () => {
		it('OWNER может обновить команду', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			const updated = { ...TEAM, name: 'New Name' }
			prisma.team.update.mockResolvedValue(updated)

			const result = await service.updateTeam(TEAM_ID, USER_ID, { name: 'New Name' })

			expect(prisma.team.update).toHaveBeenCalledOnce()
			expect(result.name).toBe('New Name')
		})

		it('ADMIN может обновить команду', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.team.update.mockResolvedValue(TEAM)

			await expect(
				service.updateTeam(TEAM_ID, MEMBER_ADMIN.userId, { name: 'New Name' }),
			).resolves.not.toThrow()
		})

		it('должен выбросить ForbiddenException если роль MEMBER', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)

			await expect(
				service.updateTeam(TEAM_ID, MEMBER_PLAIN.userId, { name: 'New Name' }),
			).rejects.toThrow(ForbiddenException)
			await expect(
				service.updateTeam(TEAM_ID, MEMBER_PLAIN.userId, { name: 'New Name' }),
			).rejects.toThrow('Недостаточно прав для обновления команды')
		})

		it('должен выбросить ForbiddenException если пользователь не состоит в команде', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.updateTeam(TEAM_ID, 'stranger-id', { name: 'New Name' }),
			).rejects.toThrow(ForbiddenException)
		})
	})

	// ── deleteTeam ────────────────────────────────────────────────────────────
	describe('deleteTeam', () => {
		it('OWNER может удалить команду и получает подтверждение', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.team.delete.mockResolvedValue(TEAM)

			const result = await service.deleteTeam(TEAM_ID, USER_ID)

			expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: TEAM_ID } })
			expect(result).toEqual({ message: 'Команда успешно удалена', success: true })
		})

		it('должен выбросить ForbiddenException если роль ADMIN', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)

			await expect(service.deleteTeam(TEAM_ID, MEMBER_ADMIN.userId)).rejects.toThrow(
				ForbiddenException,
			)
			await expect(service.deleteTeam(TEAM_ID, MEMBER_ADMIN.userId)).rejects.toThrow(
				'Только владелец может удалить команду',
			)
		})

		it('должен выбросить ForbiddenException если роль MEMBER', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)

			await expect(service.deleteTeam(TEAM_ID, MEMBER_PLAIN.userId)).rejects.toThrow(
				ForbiddenException,
			)
		})

		it('должен выбросить ForbiddenException если пользователь не состоит в команде', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(service.deleteTeam(TEAM_ID, 'stranger-id')).rejects.toThrow(
				ForbiddenException,
			)
		})
	})
})
