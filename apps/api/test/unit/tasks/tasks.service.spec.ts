import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TasksService } from '../../../src/tasks/tasks.service'
import {
	createPrismaMock,
	CREATE_TASK_DTO,
	makeTask,
	MEMBER_ADMIN,
	MEMBER_OWNER,
	MEMBER_PLAIN,
	MOCK_PROJECT,
	MOCK_TASK,
	MOVE_TASK_DTO,
	OTHER_USER_ID,
	PROJECT_ID,
	TEAM_ID,
	UPDATE_TASK_DTO,
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

	// ── findAll ───────────────────────────────────────────────────────────────
	describe('findAll', () => {
		const PAGINATION = { page: 1, limit: 10 }

		it('должен вернуть пагинированный список задач без фильтров с дефолтной сортировкой', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([MOCK_TASK])
			prisma.task.count.mockResolvedValue(1)

			const result = await service.findAll(TEAM_ID, PROJECT_ID, USER_ID, {}, PAGINATION)

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID },
					orderBy: [{ status: 'asc' }, { position: 'asc' }],
					skip: 0,
					take: 10,
				}),
			)
			expect(prisma.task.count).toHaveBeenCalledWith(
				expect.objectContaining({ where: { projectId: PROJECT_ID } }),
			)
			expect(result).toEqual({
				data: [MOCK_TASK],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			})
		})

		it('должен фильтровать задачи по status', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([MOCK_TASK])
			prisma.task.count.mockResolvedValue(1)

			await service.findAll(
				TEAM_ID,
				PROJECT_ID,
				USER_ID,
				{ status: 'TODO' as never },
				PAGINATION,
			)

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID, status: 'TODO' },
				}),
			)
		})

		it('должен фильтровать задачи по priority', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([MOCK_TASK])
			prisma.task.count.mockResolvedValue(1)

			await service.findAll(
				TEAM_ID,
				PROJECT_ID,
				USER_ID,
				{ priority: 'HIGH' as never },
				PAGINATION,
			)

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID, priority: 'HIGH' },
				}),
			)
		})

		it('должен фильтровать задачи по assigneeId', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([MOCK_TASK])
			prisma.task.count.mockResolvedValue(1)

			const ASSIGNEE_ID = 'assignee-uuid'
			await service.findAll(
				TEAM_ID,
				PROJECT_ID,
				USER_ID,
				{ assigneeId: ASSIGNEE_ID },
				PAGINATION,
			)

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID, assigneeId: ASSIGNEE_ID },
				}),
			)
		})

		it('должен выбросить ForbiddenException если пользователь не является членом команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.findAll(TEAM_ID, PROJECT_ID, USER_ID, {}, PAGINATION),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.findMany).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если проект не найден', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(null)

			await expect(
				service.findAll(TEAM_ID, PROJECT_ID, USER_ID, {}, PAGINATION),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.findMany).not.toHaveBeenCalled()
		})
	})

	// ── findOne ───────────────────────────────────────────────────────────────
	describe('findOne', () => {
		it('должен вернуть задачу если она существует и принадлежит указанному проекту', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)

			const result = await service.findOne(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID)

			expect(prisma.task.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: MOCK_TASK.id } }),
			)
			expect(result).toEqual(MOCK_TASK)
		})

		it('должен выбросить NotFoundException если задача не найдена', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(null)

			await expect(
				service.findOne(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID),
			).rejects.toThrow(NotFoundException)
		})

		it('должен выбросить NotFoundException если задача принадлежит другому проекту (IDOR)', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue({
				...MOCK_TASK,
				projectId: 'other-project-id',
			})

			await expect(
				service.findOne(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID),
			).rejects.toThrow(NotFoundException)
		})

		it('должен выбросить ForbiddenException если пользователь не является членом команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.findOne(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.findUnique).not.toHaveBeenCalled()
		})
	})

	// ── update ──────────────────────────────────────────────────────────────────
	describe('update', () => {
		const UPDATED_TASK = { ...MOCK_TASK, title: UPDATE_TASK_DTO.title }

		it('должен обновить задачу если пользователь является её создателем (даже с ролью MEMBER)', async () => {
			// MEMBER_PLAIN is the creator of the task (createdById === OTHER_USER_ID)
			const taskCreatedByPlain = { ...MOCK_TASK, createdById: OTHER_USER_ID }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)
			prisma.task.findUnique.mockResolvedValue(taskCreatedByPlain)
			prisma.task.update.mockResolvedValue({
				...taskCreatedByPlain,
				title: UPDATE_TASK_DTO.title,
			})

			const result = await service.update(
				TEAM_ID,
				PROJECT_ID,
				MOCK_TASK.id,
				OTHER_USER_ID,
				UPDATE_TASK_DTO as never,
			)

			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: MOCK_TASK.id },
					data: expect.objectContaining({ title: UPDATE_TASK_DTO.title }),
				}),
			)
			expect(result.title).toBe(UPDATE_TASK_DTO.title)
		})

		it('должен обновить задачу если пользователь является OWNER (даже если он не создавал задачу)', async () => {
			// MEMBER_OWNER.userId === USER_ID, but MOCK_TASK.createdById === USER_ID too — use a task created by someone else
			const taskByOther = { ...MOCK_TASK, createdById: OTHER_USER_ID }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(taskByOther)
			prisma.task.update.mockResolvedValue(UPDATED_TASK)

			const result = await service.update(
				TEAM_ID,
				PROJECT_ID,
				MOCK_TASK.id,
				USER_ID,
				UPDATE_TASK_DTO as never,
			)

			expect(prisma.task.update).toHaveBeenCalled()
			expect(result.title).toBe(UPDATE_TASK_DTO.title)
		})

		it('должен обновить задачу если пользователь является ADMIN (даже если он не создавал задачу)', async () => {
			const taskByOther = { ...MOCK_TASK, createdById: OTHER_USER_ID }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.task.findUnique.mockResolvedValue(taskByOther)
			prisma.task.update.mockResolvedValue(UPDATED_TASK)

			const result = await service.update(
				TEAM_ID,
				PROJECT_ID,
				MOCK_TASK.id,
				MEMBER_ADMIN.userId,
				UPDATE_TASK_DTO as never,
			)

			expect(prisma.task.update).toHaveBeenCalled()
			expect(result.title).toBe(UPDATE_TASK_DTO.title)
		})

		it('должен выбросить ForbiddenException если MEMBER пытается обновить чужую задачу', async () => {
			// MEMBER_PLAIN is not the creator (task.createdById === USER_ID, not OTHER_USER_ID)
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK) // createdById === USER_ID

			await expect(
				service.update(
					TEAM_ID,
					PROJECT_ID,
					MOCK_TASK.id,
					OTHER_USER_ID,
					UPDATE_TASK_DTO as never,
				),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.update).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если задача не найдена или не принадлежит проекту', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(null)

			await expect(
				service.update(
					TEAM_ID,
					PROJECT_ID,
					MOCK_TASK.id,
					USER_ID,
					UPDATE_TASK_DTO as never,
				),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.update).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если задача принадлежит другому проекту (IDOR)', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue({
				...MOCK_TASK,
				projectId: 'other-project-id',
			})

			await expect(
				service.update(
					TEAM_ID,
					PROJECT_ID,
					MOCK_TASK.id,
					USER_ID,
					UPDATE_TASK_DTO as never,
				),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.update).not.toHaveBeenCalled()
		})
	})

	// ── getBoard ─────────────────────────────────────────────────────────────────
	describe('getBoard', () => {
		const ALL_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const

		it('должен вернуть все 4 колонки даже если задач нет', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([])

			const result = await service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)

			expect(result).toHaveLength(ALL_STATUSES.length)
			const statuses = result.map((col) => col.status)
			for (const s of ALL_STATUSES) {
				expect(statuses).toContain(s)
			}
			result.forEach((col) => expect(col.tasks).toEqual([]))
		})

		it('должен правильно распределить задачи по колонкам', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)

			const todoTask1 = makeTask({ id: 'task-t1', status: 'TODO' as never, position: 1 })
			const todoTask2 = makeTask({ id: 'task-t2', status: 'TODO' as never, position: 2 })
			const inProgressTask = makeTask({
				id: 'task-ip',
				status: 'IN_PROGRESS' as never,
				position: 1,
			})
			const doneTask = makeTask({ id: 'task-d', status: 'DONE' as never, position: 1 })

			prisma.task.findMany.mockResolvedValue([
				todoTask1,
				todoTask2,
				inProgressTask,
				doneTask,
			])

			const result = await service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)

			const find = (s: string) => result.find((c) => c.status === s)!

			expect(find('TODO').tasks).toEqual([todoTask1, todoTask2])
			expect(find('IN_PROGRESS').tasks).toEqual([inProgressTask])
			expect(find('IN_REVIEW').tasks).toEqual([])
			expect(find('DONE').tasks).toEqual([doneTask])
		})

		it('должен запрашивать задачи с сортировкой по position ASC', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findMany.mockResolvedValue([])

			await service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID },
					orderBy: { position: 'asc' },
				}),
			)
		})

		it('должен сохранять порядок задач по position внутри колонки', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)

			const t1 = makeTask({ id: 'task-1', status: 'TODO' as never, position: 1 })
			const t2 = makeTask({ id: 'task-2', status: 'TODO' as never, position: 2 })
			const t3 = makeTask({ id: 'task-3', status: 'TODO' as never, position: 3 })

			prisma.task.findMany.mockResolvedValue([t1, t2, t3])

			const result = await service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)

			const todoCol = result.find((c) => c.status === 'TODO')!
			expect(todoCol.tasks).toEqual([t1, t2, t3])
		})

		it('должен выбросить ForbiddenException если пользователь не является членом команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				ForbiddenException,
			)

			expect(prisma.task.findMany).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если проект не найден', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(null)

			await expect(service.getBoard(TEAM_ID, PROJECT_ID, USER_ID)).rejects.toThrow(
				NotFoundException,
			)

			expect(prisma.task.findMany).not.toHaveBeenCalled()
		})
	})

	// ── moveTask ─────────────────────────────────────────────────────────────────
	describe('moveTask', () => {
		it('должен сменить статус задачи', async () => {
			const movedTask = { ...MOCK_TASK, status: 'IN_PROGRESS' as const, position: 1 }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.update.mockResolvedValue(movedTask)

			const result = await service.moveTask(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				...MOVE_TASK_DTO,
				status: 'IN_PROGRESS',
			} as never)

			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: MOCK_TASK.id },
					data: expect.objectContaining({ status: 'IN_PROGRESS' }),
				}),
			)
			expect(result.status).toBe('IN_PROGRESS')
		})

		it('должен обновить позицию задачи внутри той же колонки', async () => {
			const movedTask = { ...MOCK_TASK, position: 3 }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.update.mockResolvedValue(movedTask)

			const result = await service.moveTask(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				status: 'TODO',
				position: 3,
			} as never)

			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ position: 3 }),
				}),
			)
			expect(result.position).toBe(3)
		})

		it('должен выбросить ForbiddenException если пользователь не является членом команды', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(null)

			await expect(
				service.moveTask(
					TEAM_ID,
					PROJECT_ID,
					MOCK_TASK.id,
					USER_ID,
					MOVE_TASK_DTO as never,
				),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.update).not.toHaveBeenCalled()
		})
	})

	// ── remove ──────────────────────────────────────────────────────────────────
	describe('remove', () => {
		it('должен удалить задачу если пользователь является OWNER', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.delete.mockResolvedValue(MOCK_TASK)

			await service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID)

			expect(prisma.task.delete).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: MOCK_TASK.id } }),
			)
		})

		it('должен удалить задачу если пользователь является ADMIN', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.delete.mockResolvedValue(MOCK_TASK)

			await service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, MEMBER_ADMIN.userId)

			expect(prisma.task.delete).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: MOCK_TASK.id } }),
			)
		})

		it('должен выбросить ForbiddenException если пользователь является MEMBER (не создатель)', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)

			await expect(
				service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, OTHER_USER_ID),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.delete).not.toHaveBeenCalled()
		})

		it('должен выбросить ForbiddenException даже если MEMBER является создателем задачи', async () => {
			// Задача создана тем же пользователем, но его роль — MEMBER
			const taskCreatedByPlain = { ...MOCK_TASK, createdById: OTHER_USER_ID }
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)
			prisma.task.findUnique.mockResolvedValue(taskCreatedByPlain)

			await expect(
				service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, OTHER_USER_ID),
			).rejects.toThrow(ForbiddenException)

			expect(prisma.task.delete).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если задача не найдена или не принадлежит проекту', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(null)

			await expect(
				service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.delete).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException если задача принадлежит другому проекту (IDOR)', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue({
				...MOCK_TASK,
				projectId: 'other-project-id',
			})

			await expect(
				service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID),
			).rejects.toThrow(NotFoundException)

			expect(prisma.task.delete).not.toHaveBeenCalled()
		})
	})
})
