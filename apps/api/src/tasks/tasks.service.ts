import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { TaskStatus, type TeamMember } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'

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
			},
		})
	}
}
