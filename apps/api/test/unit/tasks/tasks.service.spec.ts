import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TasksService } from '../../../src/tasks/tasks.service'
import {
	createPrismaMock,
	CREATE_TASK_DTO,
	MEMBER_OWNER,
	MOCK_PROJECT,
	MOCK_TASK,
	PROJECT_ID,
	TEAM_ID,
	USER_ID,
} from '../../helpers/tasks.helpers'

// ── suite ─────────────────────────────────────────────────────────────────────
describe('TasksService', () => {
	let service: TasksService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createPrismaMock()
		service = new TasksService(prisma)
	})

	// ── create ────────────────────────────────────────────────────────────────
	describe('create', () => {
		it('должен создать задачу с position = 1 если задач с таким статусом ещё нет', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			// aggregate returns null when no tasks exist yet
			prisma.task.aggregate.mockResolvedValue({ _max: { position: null } })
			prisma.task.create.mockResolvedValue(MOCK_TASK)

			const result = await service.create(
				TEAM_ID,
				PROJECT_ID,
				USER_ID,
				CREATE_TASK_DTO as never,
			)

			expect(prisma.teamMember.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { teamId_userId: { teamId: TEAM_ID, userId: USER_ID } },
				}),
			)
			expect(prisma.project.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: PROJECT_ID } }),
			)
			expect(prisma.task.aggregate).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID, status: 'TODO' },
					_max: { position: true },
				}),
			)
			expect(prisma.task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						title: CREATE_TASK_DTO.title,
						projectId: PROJECT_ID,
						position: 1,
					}),
				}),
			)
			expect(result).toEqual(MOCK_TASK)
		})

		it('должен создать задачу с position = MAX + 1 если задачи уже существуют', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.aggregate.mockResolvedValue({ _max: { position: 5 } })
			prisma.task.create.mockResolvedValue({ ...MOCK_TASK, position: 6 })

			await service.create(TEAM_ID, PROJECT_ID, USER_ID, CREATE_TASK_DTO as never)

			expect(prisma.task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						position: 6,
					}),
				}),
			)
		})

		it('должен выбросить ForbiddenException если пользователь не является членом команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.create(TEAM_ID, PROJECT_ID, USER_ID, CREATE_TASK_DTO as never),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.create).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если проект не найден', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(null)

			await expect(
				service.create(TEAM_ID, PROJECT_ID, USER_ID, CREATE_TASK_DTO as never),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.create).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если проект не принадлежит указанной команде', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue({
				...MOCK_PROJECT,
				teamId: 'other-team-id',
			})

			await expect(
				service.create(TEAM_ID, PROJECT_ID, USER_ID, CREATE_TASK_DTO as never),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.create).not.toHaveBeenCalled()
		})
	})
})
