import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it } from 'vitest'
import {
	resolveTaskLabels,
	serializeTaskLabels,
} from '../../../src/tasks/task-labels.util'
import { TasksService } from '../../../src/tasks/tasks.service'
import {
	createPrismaMock,
	MEMBER_OWNER,
	MEMBER_PLAIN,
	MOCK_PROJECT,
	MOCK_TASK,
	PROJECT_ID,
	TEAM_ID,
	USER_ID,
	OTHER_USER_ID,
} from '../../helpers/tasks.helpers'

describe('Task labels', () => {
	let prisma: ReturnType<typeof createPrismaMock>
	let service: TasksService
	beforeEach(() => {
		prisma = createPrismaMock()
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)
		prisma.project.findUnique.mockResolvedValue(MOCK_PROJECT)
		prisma.task.findUnique.mockResolvedValue(MOCK_TASK)
		prisma.task.update.mockResolvedValue(MOCK_TASK)
		service = new TasksService(prisma)
	})

	it('normalizes and deduplicates insertions, skips concurrent duplicates and reads project IDs', async () => {
		prisma.taskLabel.findMany.mockResolvedValue([{ id: 'existing' }, { id: 'new' }])
		const labels = await resolveTaskLabels(prisma, PROJECT_ID, [
			' Задача  API ',
			'backend',
			'Backend',
			'Задача\tAPI',
		])
		expect(prisma.taskLabel.createMany).toHaveBeenCalledWith({
			data: [
				{ projectId: PROJECT_ID, key: 'backend', name: 'backend' },
				{ projectId: PROJECT_ID, key: 'задача api', name: 'Задача API' },
			],
			skipDuplicates: true,
		})
		expect(prisma.taskLabel.findMany).toHaveBeenCalledWith({
			where: { projectId: PROJECT_ID, key: { in: ['backend', 'задача api'] } },
			select: { id: true },
			orderBy: { key: 'asc' },
		})
		expect(labels).toEqual([{ id: 'existing' }, { id: 'new' }])
	})

	it('serializes catalog names and hides assignment records', () => {
		expect(
			serializeTaskLabels({
				id: 'task',
				labelAssignments: [{ label: { name: 'Backend' } }],
			}),
		).toEqual({ id: 'task', labels: ['Backend'] })
	})

	it('creates the catalog and task assignments in the same transaction', async () => {
		prisma.task.aggregate.mockResolvedValue({ _max: { position: null } })
		prisma.taskLabel.findMany.mockResolvedValue([{ id: 'label' }])
		await service.create(TEAM_ID, PROJECT_ID, USER_ID, {
			title: 'Task',
			labels: ['Backend'],
		})
		expect(prisma.$transaction).toHaveBeenCalledOnce()
		expect(prisma.task.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					labelAssignments: { create: [{ labelId: 'label' }] },
				}),
			}),
		)
	})

	it('preserves omitted labels and clears assignments for an explicit empty array', async () => {
		await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, { title: 'Keep' })
		expect(prisma.task.update.mock.calls[0]![0].data).not.toHaveProperty(
			'labelAssignments',
		)
		await service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, USER_ID, { labels: [] })
		expect(prisma.task.update.mock.calls[1]![0]).toMatchObject({
			where: { id: MOCK_TASK.id, projectId: PROJECT_ID, version: 0 },
			data: {
				version: { increment: 1 },
				labelAssignments: { deleteMany: {}, create: [] },
			},
		})
		expect(prisma.taskLabel.createMany).not.toHaveBeenCalled()
	})

	it('does not create catalog records when the member cannot edit a task', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)
		await expect(
			service.update(TEAM_ID, PROJECT_ID, MOCK_TASK.id, OTHER_USER_ID, {
				labels: ['Forbidden'],
			}),
		).rejects.toThrow(ForbiddenException)
		expect(prisma.$transaction).not.toHaveBeenCalled()
		expect(prisma.taskLabel.createMany).not.toHaveBeenCalled()
	})

	it('returns an escaped literal catalog search in key order and caps results', async () => {
		prisma.taskLabel.findMany.mockResolvedValue([{ name: '100%_\\done' }])
		expect(
			await service.findLabels(TEAM_ID, PROJECT_ID, USER_ID, {
				search: '  100%_\\done  ',
			}),
		).toEqual(['100%_\\done'])
		expect(prisma.taskLabel.findMany).toHaveBeenCalledWith({
			where: {
				projectId: PROJECT_ID,
				name: { contains: '100\\%\\_\\\\done', mode: 'insensitive' },
			},
			select: { name: true },
			orderBy: { key: 'asc' },
			take: 20,
		})
	})

	it('searches escaped label names together with task titles', async () => {
		prisma.task.findMany.mockResolvedValue([])
		prisma.task.count.mockResolvedValue(0)
		await service.findAll(
			TEAM_ID,
			PROJECT_ID,
			USER_ID,
			{ search: '100%_' },
			{ page: 1, limit: 20 },
		)
		const where = {
			projectId: PROJECT_ID,
			OR: [
				{ title: { contains: '100\\%\\_', mode: 'insensitive' } },
				{
					labelAssignments: {
						some: { label: { name: { contains: '100\\%\\_', mode: 'insensitive' } } },
					},
				},
			],
		}
		expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
		expect(prisma.task.count).toHaveBeenCalledWith({ where })
	})

	it('checks team membership and project scope before catalog access', async () => {
		prisma.teamMember.findUnique.mockResolvedValueOnce(null)
		await expect(service.findLabels(TEAM_ID, PROJECT_ID, USER_ID, {})).rejects.toThrow(
			ForbiddenException,
		)
		prisma.project.findUnique.mockResolvedValue({ ...MOCK_PROJECT, teamId: 'foreign' })
		await expect(service.findLabels(TEAM_ID, PROJECT_ID, USER_ID, {})).rejects.toThrow(
			NotFoundException,
		)
		expect(prisma.taskLabel.findMany).not.toHaveBeenCalled()
	})
})
