import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectsService } from '../../../src/projects/projects.service'
import {
	createPrismaMock,
	MEMBER_ADMIN,
	MEMBER_OWNER,
	MEMBER_PLAIN,
	MOCK_PROJECT,
	PROJECT_ID,
	TEAM_ID,
	USER_ID,
} from '../../helpers/projects.helpers'

// ── suite ─────────────────────────────────────────────────────────────────────
describe('ProjectsService', () => {
	let service: ProjectsService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createPrismaMock()
		service = new ProjectsService(prisma)
	})

	// ── create ────────────────────────────────────────────────────────────────
	describe('create', () => {
		it('должен создать проект если пользователь — участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.create.mockResolvedValue(MOCK_PROJECT)

			const dto = { name: 'Backend Rewrite' }
			const result = await service.create(TEAM_ID, USER_ID, dto as never)

			expect(prisma.teamMember.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { teamId_userId: { teamId: TEAM_ID, userId: USER_ID } },
				}),
			)
			expect(prisma.project.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						name: 'Backend Rewrite',
						teamId: TEAM_ID,
						createdById: USER_ID,
					}),
				}),
			)
			expect(result).toEqual(MOCK_PROJECT)
		})

		it('должен выбросить ForbiddenException если пользователь не участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.create(TEAM_ID, USER_ID, { name: 'X' } as never),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.project.create).not.toHaveBeenCalled()
		})
	})

	// ── findAllByTeam ─────────────────────────────────────────────────────────
	describe('findAllByTeam', () => {
		it('должен вернуть пагинированный список проектов команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findMany.mockResolvedValue([MOCK_PROJECT])
			prisma.project.count.mockResolvedValue(1)

			const result = await service.findAllByTeam(TEAM_ID, USER_ID, { page: 1, limit: 10 })

			expect(prisma.project.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { teamId: TEAM_ID },
					skip: 0,
					take: 10,
					orderBy: { createdAt: 'desc' },
				}),
			)
			expect(result).toEqual({
				data: [MOCK_PROJECT],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			})
		})

		it('должен вернуть пустой список если проектов нет', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findMany.mockResolvedValue([])
			prisma.project.count.mockResolvedValue(0)

			const result = await service.findAllByTeam(TEAM_ID, USER_ID, { page: 1, limit: 10 })

			expect(result).toEqual({
				data: [],
				meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
			})
		})

		it('должен выбросить ForbiddenException если пользователь не участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.findAllByTeam(TEAM_ID, USER_ID, { page: 1, limit: 10 }),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.project.findMany).not.toHaveBeenCalled()
		})
	})

	// ── findOne ───────────────────────────────────────────────────────────────
	describe('findOne', () => {
		it('должен вернуть проект если пользователь — участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)

			const result = await service.findOne(TEAM_ID, PROJECT_ID, USER_ID)

			expect(prisma.project.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: PROJECT_ID } }),
			)
			expect(result).toEqual(MOCK_PROJECT)
		})

		it('должен выбросить NotFoundException если проект не найден', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(null)

			await expect(service.findOne(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				NotFoundException,
			)
			await expect(service.findOne(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				'Проект не найден',
			)
		})

		it('должен выбросить NotFoundException если проект принадлежит другой команде (IDOR)', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue({
				...MOCK_PROJECT,
				teamId: 'other-team-id',
			})

			await expect(service.findOne(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				NotFoundException,
			)
		})

		it('должен выбросить ForbiddenException если пользователь не участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(service.findOne(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				ForbiddenException,
			)
		})
	})

	// ── update ────────────────────────────────────────────────────────────────
	describe('update', () => {
		it('OWNER должен обновить проект', async () => {
			const updated = { ...MOCK_PROJECT, name: 'New Name' }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.project.update.mockResolvedValue(updated)

			const result = await service.update(TEAM_ID, PROJECT_ID, USER_ID, {
				name: 'New Name',
			} as never)

			expect(prisma.project.update).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: PROJECT_ID } }),
			)
			expect(result).toEqual(updated)
		})

		it('ADMIN должен обновить проект', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.project.update.mockResolvedValue(MOCK_PROJECT)

			await expect(
				service.update(TEAM_ID, PROJECT_ID, MEMBER_ADMIN.userId, { name: 'X' } as never),
			).resolves.not.toThrow()
		})

		it('создатель проекта с ролью MEMBER должен иметь право обновить проект', async () => {
			// MEMBER чей userId === project.createdById
			const creatorMember = { ...MEMBER_PLAIN, userId: USER_ID, role: 'MEMBER' as const }
			prisma.teamMember.findUnique.mockResolvedValue(creatorMember)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT) // createdById === USER_ID
			prisma.project.update.mockResolvedValue(MOCK_PROJECT)

			await expect(
				service.update(TEAM_ID, PROJECT_ID, USER_ID, { name: 'X' } as never),
			).resolves.not.toThrow()
		})

		it('MEMBER не создатель должен получить ForbiddenException', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN) // userId !== createdById
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT) // createdById === USER_ID

			await expect(
				service.update(TEAM_ID, PROJECT_ID, MEMBER_PLAIN.userId, { name: 'X' } as never),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.project.update).not.toHaveBeenCalled()
		})

		it('должен выбросить ForbiddenException если пользователь не участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.update(TEAM_ID, PROJECT_ID, USER_ID, { name: 'X' } as never),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.project.update).not.toHaveBeenCalled()
		})
	})

	// ── remove ────────────────────────────────────────────────────────────────
	describe('remove', () => {
		it('OWNER должен удалить проект и вернуть подтверждение', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.project.delete.mockResolvedValue(MOCK_PROJECT)

			const result = await service.remove(TEAM_ID, PROJECT_ID, USER_ID)

			expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: PROJECT_ID } })
			expect(result).toEqual({ message: 'Проект успешно удалён', success: true })
		})

		it('ADMIN должен удалить проект', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.project.delete.mockResolvedValue(MOCK_PROJECT)

			await expect(
				service.remove(TEAM_ID, PROJECT_ID, MEMBER_ADMIN.userId),
			).resolves.toEqual({ message: 'Проект успешно удалён', success: true })
		})

		it('MEMBER (даже создатель) не должен иметь право удалять проект', async () => {
			// Создатель с ролью MEMBER
			const creatorMember = { ...MEMBER_PLAIN, userId: USER_ID, role: 'MEMBER' as const }
			prisma.teamMember.findUnique.mockResolvedValue(creatorMember)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)

			await expect(service.remove(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				ForbiddenException,
			)

			expect(prisma.project.delete).not.toHaveBeenCalled()
		})

		it('должен выбросить ForbiddenException если пользователь не участник команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(service.remove(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				ForbiddenException,
			)

			expect(prisma.project.delete).not.toHaveBeenCalled()
		})
	})
})
