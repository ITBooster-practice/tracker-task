import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TasksService } from '../../../src/tasks/tasks.service'
import {
	createPrismaMock,
	CREATE_TASK_DTO,
	MEMBER_ADMIN,
	MEMBER_OWNER,
	MEMBER_PLAIN,
	MOCK_PROJECT,
	MOCK_TASK,
	MOCK_TASK_RESPONSE,
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
		prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
		service = new TasksService(prisma)
	})

	it.each(['findOne', 'update', 'remove'] as const)(
		'rejects a project from another team in %s',
		async (method) => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.project.findUnique.mockResolvedValue({
				...MOCK_PROJECT,
				teamId: 'another-team',
			})
			const request =
				method === 'findOne'
					? service.findOne(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID)
					: method === 'update'
						? service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
								title: 'Changed',
							})
						: service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID)
			await expect(request).rejects.toThrow(NotFoundException)
			expect(prisma.task.findUnique).not.toHaveBeenCalled()
			expect(prisma.task.update).not.toHaveBeenCalled()
			expect(prisma.task.delete).not.toHaveBeenCalled()
		},
	)
	it('keeps a custom column when updating status and checks the task version atomically', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
		prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
		prisma.boardColumn.findFirst.mockResolvedValue({
			id: MOCK_TASK.boardColumnId,
			boardId: 'main-board-id',
			isSystem: false,
		})
		prisma.task.update.mockResolvedValue({ ...MOCK_TASK, status: 'DONE' })
		await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, { status: 'DONE' })
		const request = prisma.task.update.mock.calls[0]![0]
		expect(request.where).toEqual({
			id: MOCK_TASK.id,
			projectId: PROJECT_ID,
			boardColumnId: MOCK_TASK.boardColumnId,
			version: MOCK_TASK.version,
		})
		expect(request.data.status).toBe('DONE')
		expect(request.data.boardColumnId).toBe(MOCK_TASK.boardColumnId)
		expect(request.data.position).toBe(MOCK_TASK.position)
		expect(prisma.$executeRaw).not.toHaveBeenCalled()
	})
	it('maps a system column status to the corresponding column', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
		prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
		prisma.task.update.mockResolvedValue(MOCK_TASK)
		await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, { status: 'DONE' })
		expect(prisma.task.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					status: 'DONE',
					boardColumnId: 'done-column-id',
				}),
			}),
		)
	})
	it('reports a conflict if a concurrent edit or move changed the task', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
		prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
		prisma.task.update.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError('Changed', {
				code: 'P2025',
				clientVersion: 'test',
			}),
		)
		await expect(
			service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, { title: 'Changed' }),
		).rejects.toThrow(ConflictException)
	})
	describe('column updates', () => {
		const source = {
			id: MOCK_TASK.boardColumnId,
			boardId: 'main-board-id',
			projectId: PROJECT_ID,
			key: 'TODO',
			isSystem: true,
		}
		const custom = { ...source, id: 'custom-column', key: 'qa', isSystem: false }
		beforeEach(() => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.update.mockImplementation(({ data }) => ({
				...MOCK_TASK,
				...data,
				version: 1,
				labelAssignments: [],
			}))
		})

		it('saves fields, labels and an appended custom placement in one versioned write', async () => {
			prisma.boardColumn.findFirst
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(custom)
			prisma.taskLabel.findMany.mockResolvedValue([{ id: 'label' }])
			prisma.$queryRaw
				.mockResolvedValueOnce([{ id: source.boardId }])
				.mockResolvedValueOnce([
					MOCK_TASK,
					{ ...MOCK_TASK, id: 'target-task', boardColumnId: custom.id, position: 0 },
				])
			const result = await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				title: 'Changed together',
				boardColumnId: custom.id,
				labels: ['Backend'],
			})
			expect(result).toMatchObject({
				title: 'Changed together',
				boardColumnId: custom.id,
				status: 'TODO',
				position: 1,
				version: 1,
			})
			expect(prisma.boardColumn.findFirst).toHaveBeenLastCalledWith({
				where: { id: custom.id, boardId: source.boardId, projectId: PROJECT_ID },
			})
			expect(prisma.$transaction).toHaveBeenCalledOnce()
			expect(prisma.task.update).toHaveBeenCalledOnce()
			expect(prisma.task.update.mock.calls[0]![0].data).toMatchObject({
				title: 'Changed together',
				boardColumnId: custom.id,
				labelAssignments: { deleteMany: {}, create: [{ labelId: 'label' }] },
			})
		})

		it('lets the selected system column override an explicitly different status', async () => {
			const done = { ...source, id: 'done-column', key: 'DONE' }
			prisma.boardColumn.findFirst
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(done)
			const result = await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				boardColumnId: done.id,
				status: 'IN_REVIEW',
			})
			expect(result).toMatchObject({
				boardColumnId: done.id,
				status: 'DONE',
				position: 0,
			})
		})

		it('preserves the position and skips task ordering when the chosen column is unchanged', async () => {
			prisma.boardColumn.findFirst.mockResolvedValue(custom)
			prisma.task.findUnique.mockResolvedValue({ ...MOCK_TASK, boardColumnId: custom.id })
			const result = await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				boardColumnId: custom.id,
				status: 'IN_REVIEW',
			})
			expect(result).toMatchObject({
				boardColumnId: custom.id,
				position: MOCK_TASK.position,
				status: 'IN_REVIEW',
			})
			expect(prisma.$queryRaw).toHaveBeenCalledOnce()
			expect(prisma.$executeRaw).not.toHaveBeenCalled()
		})

		it('rejects a destination outside the current board before writing fields or labels', async () => {
			prisma.boardColumn.findFirst
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(null)
			await expect(
				service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
					title: 'Rejected',
					boardColumnId: 'foreign-column',
					labels: ['Rejected'],
				}),
			).rejects.toThrow(NotFoundException)
			expect(prisma.task.update).not.toHaveBeenCalled()
			expect(prisma.taskLabel.createMany).not.toHaveBeenCalled()
		})

		it('rejects a move if the task changed while waiting for the board lock', async () => {
			prisma.boardColumn.findFirst
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(source)
				.mockResolvedValueOnce(custom)
			prisma.$queryRaw
				.mockResolvedValueOnce([{ id: source.boardId }])
				.mockResolvedValueOnce([{ ...MOCK_TASK, version: 1 }])
			await expect(
				service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
					boardColumnId: custom.id,
				}),
			).rejects.toThrow(ConflictException)
			expect(prisma.task.update).not.toHaveBeenCalled()
		})

		it('rejects unsupported status values before entering the transaction', async () => {
			await expect(
				service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
					status: 'BACKLOG',
				}),
			).rejects.toThrow(BadRequestException)
			expect(prisma.$transaction).not.toHaveBeenCalled()
		})
	})
	it('searches by the full task UUID within the current project', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
		prisma.task.findMany.mockResolvedValue([])
		prisma.task.count.mockResolvedValue(0)
		const key = '01234567-89ab-cdef-0123-456789abcdef'
		await service.findAll(
			TEAM_ID,
			PROJECT_ID,
			USER_ID,
			{ search: key },
			{ page: 1, limit: 20 },
		)
		expect(prisma.task.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					projectId: PROJECT_ID,
					boardColumn: { board: { archivedAt: null } },
					OR: [
						{ title: { contains: key, mode: 'insensitive' } },
						{ id: key },
						{
							labelAssignments: {
								some: { label: { name: { contains: key, mode: 'insensitive' } } },
							},
						},
					],
				},
			}),
		)
	})
	it.each(['TT-20064af7', 'tt-20064AF7', ' TT-20064 '])(
		'searches by the displayed code or its prefix within the current project: %s',
		async (code) => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findMany.mockResolvedValue([])
			prisma.task.count.mockResolvedValue(0)
			await service.findAll(
				TEAM_ID,
				PROJECT_ID,
				USER_ID,
				{ search: code },
				{ page: 1, limit: 20 },
			)
			const where = {
				projectId: PROJECT_ID,
				boardColumn: { board: { archivedAt: null } },
				OR: expect.arrayContaining([
					{ id: { startsWith: code.trim().slice(3).toLowerCase(), mode: 'insensitive' } },
				]),
			}
			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where }),
			)
			expect(prisma.task.count).toHaveBeenCalledWith({ where })
		},
	)

	// ── create ────────────────────────────────────────────────────────────────
	describe('create', () => {
		it('rejects a status unsupported by task storage before selecting a column', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			await expect(
				service.create(TEAM_ID, PROJECT_ID, USER_ID, {
					title: 'Task',
					status: 'BACKLOG',
					boardColumnId: 'custom-column',
				}),
			).rejects.toThrow(BadRequestException)
			expect(prisma.boardColumn.findFirst).not.toHaveBeenCalled()
			expect(prisma.task.create).not.toHaveBeenCalled()
		})
		it('creates the first task at position 1 within its column', async () => {
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
					where: { projectId: PROJECT_ID, boardColumnId: 'system-column-id' },
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
			expect(result).toEqual(MOCK_TASK_RESPONSE)
		})

		it('creates directly in a custom column and preserves the requested status', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.boardColumn.findFirst.mockResolvedValue({
				id: 'custom-column',
				boardId: 'custom-board',
				key: 'qa',
				isSystem: false,
			})
			prisma.task.aggregate.mockResolvedValue({ _max: { position: 3 } })
			prisma.task.create.mockResolvedValue(MOCK_TASK)
			await service.create(TEAM_ID, PROJECT_ID, USER_ID, {
				title: 'QA task',
				boardColumnId: 'custom-column',
				status: 'IN_REVIEW',
			})
			expect(prisma.boardColumn.findFirst).toHaveBeenNthCalledWith(1, {
				where: {
					id: 'custom-column',
					projectId: PROJECT_ID,
					board: { archivedAt: null },
				},
			})
			expect(prisma.task.aggregate).toHaveBeenCalledWith({
				where: { projectId: PROJECT_ID, boardColumnId: 'custom-column' },
				_max: { position: true },
			})
			expect(prisma.task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						boardColumnId: 'custom-column',
						status: 'IN_REVIEW',
						position: 4,
					}),
				}),
			)
		})

		it('uses the selected system column status even when the request has another status', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.boardColumn.findFirst.mockResolvedValue({
				id: 'done-column',
				boardId: 'main-board',
				key: 'DONE',
				isSystem: true,
			})
			prisma.task.aggregate.mockResolvedValue({ _max: { position: null } })
			await service.create(TEAM_ID, PROJECT_ID, USER_ID, {
				title: 'Done',
				boardColumnId: 'done-column',
				status: 'TODO',
			})
			expect(prisma.task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ boardColumnId: 'done-column', status: 'DONE' }),
				}),
			)
		})

		it.each(['missing-column', 'deleted-column', 'deleted-board'])(
			'rejects %s without creating a misplaced task',
			async (scenario) => {
				prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
				if (scenario === 'missing-column')
					prisma.boardColumn.findFirst.mockResolvedValueOnce(null)
				if (scenario === 'deleted-column')
					prisma.boardColumn.findFirst
						.mockResolvedValueOnce({ id: 'column', boardId: 'board' })
						.mockResolvedValueOnce(null)
				if (scenario === 'deleted-board') prisma.$queryRaw.mockResolvedValueOnce([])
				await expect(
					service.create(TEAM_ID, PROJECT_ID, USER_ID, {
						title: 'Task',
						boardColumnId: 'column',
					}),
				).rejects.toThrow(NotFoundException)
				expect(prisma.task.create).not.toHaveBeenCalled()
			},
		)

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
					where: { projectId: PROJECT_ID, boardColumn: { board: { archivedAt: null } } },
					orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
					skip: 0,
					take: 10,
				}),
			)
			expect(prisma.task.count).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { projectId: PROJECT_ID, boardColumn: { board: { archivedAt: null } } },
				}),
			)
			expect(result).toEqual({
				data: [MOCK_TASK_RESPONSE],
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
					where: {
						projectId: PROJECT_ID,
						status: 'TODO',
						boardColumn: { board: { archivedAt: null } },
					},
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
					where: {
						projectId: PROJECT_ID,
						priority: 'HIGH',
						boardColumn: { board: { archivedAt: null } },
					},
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
					where: {
						projectId: PROJECT_ID,
						assigneeId: ASSIGNEE_ID,
						boardColumn: { board: { archivedAt: null } },
					},
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
				expect.objectContaining({
					where: {
						id: MOCK_TASK.id,
						projectId: PROJECT_ID,
						boardColumn: { board: { archivedAt: null } },
					},
				}),
			)
			expect(result).toEqual(MOCK_TASK_RESPONSE)
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
		const UPDATED_TASK = { ...MOCK_TASK, title: UPDATE_TASK_DTO.title, version: 1 }

		it('очищает исполнителя и дедлайн через null, не меняя колонку', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.update.mockResolvedValue({
				...MOCK_TASK,
				assigneeId: null,
				dueDate: null,
			})
			await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, {
				assigneeId: null,
				dueDate: null,
			})
			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						version: { increment: 1 },
						assigneeId: null,
						dueDate: null,
					}),
				}),
			)
			expect(prisma.boardColumn.findFirstOrThrow).not.toHaveBeenCalled()
		})

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
					where: {
						id: MOCK_TASK.id,
						projectId: PROJECT_ID,
						boardColumnId: MOCK_TASK.boardColumnId,
						version: MOCK_TASK.version,
					},
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

	// ── remove ──────────────────────────────────────────────────────────────────
	describe('remove', () => {
		it('должен удалить задачу если пользователь является OWNER', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.delete.mockResolvedValue(MOCK_TASK)

			await service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID)

			expect(prisma.task.delete).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						id: MOCK_TASK.id,
						projectId: PROJECT_ID,
						boardColumnId: MOCK_TASK.boardColumnId,
					},
				}),
			)
		})

		it('должен удалить задачу если пользователь является ADMIN', async () => {
			prisma.teamMember.findUnique.mockResolvedValue(MEMBER_ADMIN)
			prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
			prisma.task.delete.mockResolvedValue(MOCK_TASK)

			await service.remove(TEAM_ID, PROJECT_ID, MOCK_TASK.id, MEMBER_ADMIN.userId)

			expect(prisma.task.delete).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						id: MOCK_TASK.id,
						projectId: PROJECT_ID,
						boardColumnId: MOCK_TASK.boardColumnId,
					},
				}),
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
