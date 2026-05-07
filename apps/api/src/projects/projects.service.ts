import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Project, TeamMember } from 'generated/prisma/client'
import { CreateProjectDto } from './dto/create-project.dto'
import { PrismaService } from '../../prisma/prisma.service'
import {
	buildPaginatedResponse,
	getPaginationPrismaParams,
	type PaginationOptions,
} from '../utils/pagination.util'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectsService {
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

	private assertCanModify(
		member: TeamMember,
		project: Project,
		action: 'update' | 'delete',
	) {
		const isAdminOrOwner = member.role === 'ADMIN' || member.role === 'OWNER'
		const isCreator = project.createdById === member.userId

		const canModify = action === 'delete' ? isAdminOrOwner : isAdminOrOwner || isCreator

		if (!canModify) {
			throw new ForbiddenException('Недостаточно прав для выполнения этого действия')
		}
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

	async create(teamId: string, userId: string, dto: CreateProjectDto) {
		await this.assertTeamMember(teamId, userId)

		return this.prisma.project.create({
			data: {
				name: dto.name,
				description: dto.description,
				teamId,
				createdById: userId,
			},
		})
	}

	async findAllByTeam(teamId: string, userId: string, pagination: PaginationOptions) {
		await this.assertTeamMember(teamId, userId)

		const { take, skip } = getPaginationPrismaParams(pagination)

		const [projects, totalCount] = await Promise.all([
			this.prisma.project.findMany({
				where: { teamId },
				take,
				skip,
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.project.count({ where: { teamId } }),
		])

		return buildPaginatedResponse(projects, pagination, totalCount)
	}

	async findOne(teamId: string, projectId: string, userId: string) {
		await this.assertTeamMember(teamId, userId)

		return this.findProjectOrThrow(teamId, projectId)
	}

	async update(teamId: string, projectId: string, userId: string, dto: UpdateProjectDto) {
		const member = await this.assertTeamMember(teamId, userId)

		const project = await this.findProjectOrThrow(teamId, projectId)

		this.assertCanModify(member, project, 'update')

		return this.prisma.project.update({
			where: { id: projectId },
			data: {
				name: dto.name,
				description: dto.description,
			},
		})
	}

	async remove(teamId: string, projectId: string, userId: string) {
		const member = await this.assertTeamMember(teamId, userId)
		const project = await this.findProjectOrThrow(teamId, projectId)

		this.assertCanModify(member, project, 'delete')

		await this.prisma.project.delete({ where: { id: projectId } })

		return { message: 'Проект успешно удалён', success: true }
	}
}
