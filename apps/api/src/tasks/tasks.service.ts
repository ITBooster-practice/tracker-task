import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { TaskStatus, TeamRole, type TeamMember } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
	buildPaginatedResponse,
	getPaginationPrismaParams,
	type PaginationOptions,
} from '../utils/pagination.util'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskFilterQueryDto } from './dto/task-filter-query.dto'

@Injectable()
export class TasksService {
	constructor(private readonly prisma: PrismaService) {}

	private async assertTeamMember(teamId: string, userId: string): Promise<TeamMember> {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})

		if (!member) {
			throw new ForbiddenException('У вас нет доступа к этой команде')
		}

		return member
	}

	private async findProjectOrThrow(teamId: string, projectId: string) {
		const project = await this.prisma.project.findUnique({ where: { id: projectId } })

		if (!project) {
			throw new NotFoundException('Проект не найден')
		}

		if (project.teamId !== teamId) {
			throw new NotFoundException('Проект не относится к этой команде')
		}

		return project
	}

	async create(teamId: string, projectId: string, userId: string, dto: CreateTaskDto) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)

		const status = dto.status ?? TaskStatus.TODO

		const aggregate = await this.prisma.task.aggregate({
			where: { projectId, status: status as never },
			_max: { position: true },
		})

		const maxPosition = aggregate._max.position
		const position = maxPosition === null ? 1 : maxPosition + 1

		return this.prisma.task.create({
			data: {
				title: dto.title,
				description: dto.description,
				status: status as never,
				priority: dto.priority as never,
				assigneeId: dto.assigneeId,
				dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
				projectId,
				position,
				createdById: userId,
			},
		})
	}

	async findAll(
		teamId: string,
		projectId: string,
		userId: string,
		filters: Pick<TaskFilterQueryDto, 'status' | 'priority' | 'assigneeId'>,
		pagination: PaginationOptions,
	) {
		await this.assertTeamMember(teamId, userId)
		await this.findProjectOrThrow(teamId, projectId)

		const where = {
			projectId,
			...(filters.status && { status: filters.status as never }),
			...(filters.priority && { priority: filters.priority as never }),
			...(filters.assigneeId && { assigneeId: filters.assigneeId }),
		}

		const { skip, take } = getPaginationPrismaParams(pagination)

		const [tasks, total] = await Promise.all([
			this.prisma.task.findMany({
				where,
				orderBy: [{ status: 'asc' }, { position: 'asc' }],
				skip,
				take,
			}),
			this.prisma.task.count({ where }),
		])

		return buildPaginatedResponse(tasks, pagination, total)
	}

	async findOne(teamId: string, projectId: string, taskId: string, userId: string) {
		await this.assertTeamMember(teamId, userId)
		return this.findTaskOrThrow(projectId, taskId)
	}

	private async findTaskOrThrow(projectId: string, taskId: string) {
		const task = await this.prisma.task.findUnique({ where: { id: taskId } })

		if (!task || task.projectId !== projectId) {
			throw new NotFoundException('Задача не найдена в этом проекте')
		}

		return task
	}

	async update(
		teamId: string,
		projectId: string,
		taskId: string,
		userId: string,
		dto: UpdateTaskDto,
	) {
		const member = await this.assertTeamMember(teamId, userId)
		const task = await this.findTaskOrThrow(projectId, taskId)

		const isAdminOrOwner =
			member.role === TeamRole.ADMIN || member.role === TeamRole.OWNER
		const isCreator = task.createdById === userId

		if (!isCreator && !isAdminOrOwner) {
			throw new ForbiddenException('Недостаточно прав для выполнения этого действия')
		}

		return this.prisma.task.update({
			where: { id: taskId },
			data: {
				...(dto.title !== undefined && { title: dto.title }),
				...(dto.description !== undefined && { description: dto.description }),
				...(dto.status !== undefined && { status: dto.status as never }),
				...(dto.priority !== undefined && { priority: dto.priority as never }),
				...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
				...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
			},
		})
	}

	async remove(teamId: string, projectId: string, taskId: string, userId: string) {
		const member = await this.assertTeamMember(teamId, userId)

		const isAdminOrOwner =
			member.role === TeamRole.ADMIN || member.role === TeamRole.OWNER

		if (!isAdminOrOwner) {
			throw new ForbiddenException('Недостаточно прав для выполнения этого действия')
		}

		await this.findTaskOrThrow(projectId, taskId)

		await this.prisma.task.delete({ where: { id: taskId } })

		return { message: 'Задача успешно удалена', success: true }
	}
}
