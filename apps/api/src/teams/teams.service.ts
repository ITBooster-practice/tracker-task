import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateTeamDto } from './dto/create-team.dto'
import { UpdateTeamDto } from './dto/update-team.dto'

@Injectable()
export class TeamsService {
	constructor(private readonly prisma: PrismaService) {}

	async createTeam(userId: string, dto: CreateTeamDto) {
		const team = await this.prisma.team.create({
			data: {
				name: dto.name,
				description: dto.description,
				avatarUrl: dto.avatarUrl,
				members: {
					create: {
						userId,
						role: 'OWNER',
					},
				},
			},
			include: {
				members: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
					},
				},
			},
		})

		return team
	}

	async getUserTeams(userId: string) {
		const memberships = await this.prisma.teamMember.findMany({
			where: { userId },
			include: {
				team: {
					include: {
						_count: { select: { members: true } },
					},
				},
			},
		})

		return memberships.map((m) => ({
			id: m.team.id,
			name: m.team.name,
			description: m.team.description,
			avatarUrl: m.team.avatarUrl,
			membersCount: m.team._count.members,
			currentUserRole: m.role,
			createdAt: m.team.createdAt,
			updatedAt: m.team.updatedAt,
		}))
	}

	async getTeamById(teamId: string, userId: string) {
		const team = await this.prisma.team.findUnique({
			where: { id: teamId },
			include: {
				members: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
					},
				},
			},
		})

		if (!team) {
			throw new NotFoundException('Команда не найдена')
		}

		const isMember = team.members.some((m) => m.userId === userId)
		if (!isMember) {
			throw new ForbiddenException('Вы не являетесь участником этой команды')
		}

		return team
	}

	async updateTeam(teamId: string, userId: string, dto: UpdateTeamDto) {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})

		if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
			throw new ForbiddenException('Недостаточно прав для обновления команды')
		}

		return this.prisma.team.update({
			where: { id: teamId },
			data: {
				name: dto.name,
				description: dto.description,
				avatarUrl: dto.avatarUrl,
			},
			include: {
				members: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
					},
				},
			},
		})
	}

	async deleteTeam(teamId: string, userId: string) {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})

		if (!member || member.role !== 'OWNER') {
			throw new ForbiddenException('Только владелец может удалить команду')
		}

		await this.prisma.team.delete({ where: { id: teamId } })

		return { message: 'Команда успешно удалена', success: true }
	}
}
