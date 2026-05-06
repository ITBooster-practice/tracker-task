import { ForbiddenException, Injectable } from '@nestjs/common'
import type { TeamMember } from 'generated/prisma/client'
import { CreateProjectDto } from './dto/create-project.dto'
import { PrismaService } from '../../prisma/prisma.service'
import {
	buildPaginatedResponse,
	getPaginationPrismaParams,
	PaginationOptions,
} from '../utils/pagination.util'

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
}
