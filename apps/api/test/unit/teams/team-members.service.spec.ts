import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamMembersService } from '../../../src/teams/members/team-members.service'
import {
	createPrismaMock,
	USER_ID,
	TEAM_ID,
	MEMBER_OWNER,
	MEMBER_ADMIN,
	MEMBER_PLAIN,
} from '../../helpers/teams.helpers'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEAM_WITH_MEMBERS = {
	id: TEAM_ID,
	name: 'Dream Team',
	members: [
		{
			...MEMBER_OWNER,
			user: { id: USER_ID, name: 'Alice', email: 'alice@example.com' },
		},
		{
			...MEMBER_ADMIN,
			user: { id: MEMBER_ADMIN.userId, name: 'Bob', email: 'bob@example.com' },
		},
		{
			...MEMBER_PLAIN,
			user: { id: MEMBER_PLAIN.userId, name: 'Charlie', email: 'charlie@example.com' },
		},
	],
}

// ── suite ─────────────────────────────────────────────────────────────────────
describe('TeamMembersService', () => {
	let service: TeamMembersService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createPrismaMock()
		service = new TeamMembersService(prisma)
	})

	// ── getMembers ────────────────────────────────────────────────────────────
	describe('getMembers', () => {
		it('должен вернуть пагинированный список участников команды', async () => {
			prisma.team.findUnique.mockResolvedValue({ id: TEAM_ID })
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.teamMember.findMany.mockResolvedValue(TEAM_WITH_MEMBERS.members)
			prisma.teamMember.count.mockResolvedValue(TEAM_WITH_MEMBERS.members.length)

			const result = await service.getMembers(TEAM_ID, USER_ID, {
				page: 1,
				limit: 10,
			})

			expect(prisma.team.findUnique).toHaveBeenCalledWith({
				where: { id: TEAM_ID },
				select: { id: true },
			})
			expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
				where: { teamId_userId: { teamId: TEAM_ID, userId: USER_ID } },
			})
			expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
				where: { teamId: TEAM_ID },
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
				orderBy: { joinedAt: 'asc' },
				skip: 0,
				take: 10,
			})
			expect(result).toEqual({
				data: TEAM_WITH_MEMBERS.members,
				meta: {
					page: 1,
					limit: 10,
					total: 3,
					totalPages: 1,
				},
			})
		})

		it('должен выбросить 404 если команда не найдена', async () => {
			prisma.team.findUnique.mockResolvedValue(null)
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)

			await expect(
				service.getMembers(TEAM_ID, USER_ID, { page: 1, limit: 10 }),
			).rejects.toThrow(NotFoundException)
		})

		it('должен выбросить 403 если пользователь не участник команды', async () => {
			prisma.team.findUnique.mockResolvedValue({ id: TEAM_ID })
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.getMembers(TEAM_ID, 'stranger-id', { page: 1, limit: 10 }),
			).rejects.toThrow(ForbiddenException)
		})
	})

	// ── changeRole ────────────────────────────────────────────────────────────
	describe('changeRole', () => {
		it('успешно меняет роль участника (права проверяются в RolesGuard)', async () => {
			const updated = {
				...MEMBER_PLAIN,
				role: 'ADMIN' as const,
				user: { id: MEMBER_PLAIN.userId, name: 'Charlie', email: 'charlie@example.com' },
			}
			prisma.teamMember.findUnique.mockResolvedValueOnce(MEMBER_PLAIN) // target
			prisma.teamMember.update.mockResolvedValue(updated)

			const result = await service.changeRole(TEAM_ID, USER_ID, MEMBER_PLAIN.userId, {
				role: 'ADMIN',
			})

			expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
				where: { teamId_userId: { teamId: TEAM_ID, userId: MEMBER_PLAIN.userId } },
			})
			expect(prisma.teamMember.update).toHaveBeenCalledOnce()
			expect(result).toEqual(updated)
		})

		it('должен выбросить 403 если actor пытается изменить свою роль', async () => {
			await expect(
				service.changeRole(TEAM_ID, USER_ID, USER_ID, { role: 'ADMIN' }),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбросить 403 если target является OWNER', async () => {
			prisma.teamMember.findUnique.mockResolvedValueOnce(MEMBER_OWNER)

			await expect(
				service.changeRole(TEAM_ID, MEMBER_ADMIN.userId, USER_ID, { role: 'MEMBER' }),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбросить 404 если target не в команде', async () => {
			prisma.teamMember.findUnique.mockResolvedValueOnce(null)

			await expect(
				service.changeRole(TEAM_ID, USER_ID, 'unknown-id', { role: 'MEMBER' }),
			).rejects.toThrow(NotFoundException)
		})
	})

	// ── removeMember ──────────────────────────────────────────────────────────
	describe('removeMember', () => {
		it('OWNER удаляет MEMBER', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_OWNER) // actor
				.mockResolvedValueOnce(MEMBER_PLAIN) // target
			prisma.teamMember.delete.mockResolvedValue(MEMBER_PLAIN)

			const result = await service.removeMember(TEAM_ID, USER_ID, MEMBER_PLAIN.userId)

			expect(prisma.teamMember.delete).toHaveBeenCalledOnce()
			expect(result).toEqual({ message: 'Участник успешно исключён', success: true })
		})

		it('ADMIN удаляет MEMBER', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_ADMIN) // actor
				.mockResolvedValueOnce(MEMBER_PLAIN) // target
			prisma.teamMember.delete.mockResolvedValue(MEMBER_PLAIN)

			const result = await service.removeMember(
				TEAM_ID,
				MEMBER_ADMIN.userId,
				MEMBER_PLAIN.userId,
			)

			expect(prisma.teamMember.delete).toHaveBeenCalledOnce()
			expect(result).toEqual({ message: 'Участник успешно исключён', success: true })
		})

		it('MEMBER покидает команду самостоятельно (self-leave)', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_PLAIN) // actor = target
				.mockResolvedValueOnce(MEMBER_PLAIN) // target
			prisma.teamMember.delete.mockResolvedValue(MEMBER_PLAIN)

			const result = await service.removeMember(
				TEAM_ID,
				MEMBER_PLAIN.userId,
				MEMBER_PLAIN.userId,
			)

			expect(prisma.teamMember.delete).toHaveBeenCalledOnce()
			expect(result).toEqual({ message: 'Вы покинули команду', success: true })
		})

		it('ADMIN покидает команду самостоятельно (self-leave)', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_ADMIN) // actor = target
				.mockResolvedValueOnce(MEMBER_ADMIN) // target
			prisma.teamMember.delete.mockResolvedValue(MEMBER_ADMIN)

			const result = await service.removeMember(
				TEAM_ID,
				MEMBER_ADMIN.userId,
				MEMBER_ADMIN.userId,
			)

			expect(prisma.teamMember.delete).toHaveBeenCalledOnce()
			expect(result).toEqual({ message: 'Вы покинули команду', success: true })
		})

		it('должен выбросить 403 при попытке удалить OWNER', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_ADMIN) // actor
				.mockResolvedValueOnce(MEMBER_OWNER) // target is OWNER

			await expect(
				service.removeMember(TEAM_ID, MEMBER_ADMIN.userId, USER_ID),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбросить 403 если MEMBER пытается удалить другого участника', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_PLAIN) // actor is MEMBER
				.mockResolvedValueOnce(MEMBER_ADMIN) // target

			await expect(
				service.removeMember(TEAM_ID, MEMBER_PLAIN.userId, MEMBER_ADMIN.userId),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбросить 403 если ADMIN пытается удалить другого ADMIN', async () => {
			const anotherAdmin = { ...MEMBER_ADMIN, id: 'member-id-4', userId: 'user-id-4' }
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_ADMIN) // actor is ADMIN
				.mockResolvedValueOnce(anotherAdmin) // target is also ADMIN

			await expect(
				service.removeMember(TEAM_ID, MEMBER_ADMIN.userId, anotherAdmin.userId),
			).rejects.toThrow(ForbiddenException)
		})

		it('должен выбросить 404 если target не в команде', async () => {
			prisma.teamMember.findUnique
				.mockResolvedValueOnce(MEMBER_OWNER) // actor
				.mockResolvedValueOnce(null) // target not found

			await expect(service.removeMember(TEAM_ID, USER_ID, 'unknown-id')).rejects.toThrow(
				NotFoundException,
			)
		})
	})
})
