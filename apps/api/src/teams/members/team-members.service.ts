import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { ChangeRoleDto } from './dto/change-role.dto'
import {
	buildPaginatedResponse,
	getPaginationPrismaParams,
	type PaginationOptions,
} from '../../utils/pagination.util'

@Injectable()
export class TeamMembersService {
	constructor(private readonly prisma: PrismaService) {}

	async getMembers(teamId: string, userId: string, pagination: PaginationOptions) {
		const [team, actor] = await Promise.all([
			this.prisma.team.findUnique({
				where: { id: teamId },
				select: { id: true },
			}),
			this.prisma.teamMember.findUnique({
				where: { teamId_userId: { teamId, userId } },
			}),
		])

		if (!team) {
			throw new NotFoundException('Команда не найдена')
		}

		if (!actor) {
			throw new ForbiddenException('Вы не являетесь участником этой команды')
		}

		const paginationParams = getPaginationPrismaParams(pagination)

		const [members, total] = await Promise.all([
			this.prisma.teamMember.findMany({
				where: { teamId },
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
				orderBy: { joinedAt: 'asc' },
				...paginationParams,
			}),
			this.prisma.teamMember.count({ where: { teamId } }),
		])

		return buildPaginatedResponse(members, pagination, total)
	}

	async changeRole(
		teamId: string,
		actorId: string,
		targetUserId: string,
		dto: ChangeRoleDto,
	) {
		if (actorId === targetUserId) {
			throw new ForbiddenException('Нельзя изменить свою собственную роль')
		}

		void actorId

		const target = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: targetUserId } },
		})

		if (!target) {
			throw new NotFoundException('Участник не найден в команде')
		}

		// OWNER не может быть понижен
		if (target.role === 'OWNER') {
			throw new ForbiddenException('Нельзя изменить роль владельца команды')
		}

		return this.prisma.teamMember.update({
			where: { teamId_userId: { teamId, userId: targetUserId } },
			data: { role: dto.role },
			include: {
				user: { select: { id: true, name: true, email: true } },
			},
		})
	}

	async removeMember(teamId: string, actorId: string, targetUserId: string) {
		const isSelfLeave = actorId === targetUserId

		const [actor, target] = await Promise.all([
			this.prisma.teamMember.findUnique({
				where: { teamId_userId: { teamId, userId: actorId } },
			}),
			this.prisma.teamMember.findUnique({
				where: { teamId_userId: { teamId, userId: targetUserId } },
			}),
		])

		if (!actor) {
			throw new ForbiddenException('Вы не являетесь участником этой команды')
		}

		if (!target) {
			throw new NotFoundException('Участник не найден в команде')
		}

		// OWNER не может быть удалён никем
		if (target.role === 'OWNER') {
			throw new ForbiddenException('Владелец команды не может быть удалён')
		}

		// Если не самоуход — нужны права OWNER или ADMIN
		if (!isSelfLeave && actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
			throw new ForbiddenException('Недостаточно прав для исключения участника')
		}

		// ADMIN не может удалить другого ADMIN (только OWNER может)
		if (!isSelfLeave && actor.role === 'ADMIN' && target.role === 'ADMIN') {
			throw new ForbiddenException(
				'Администратор не может исключить другого администратора',
			)
		}

		await this.prisma.teamMember.delete({
			where: { teamId_userId: { teamId, userId: targetUserId } },
		})

		return {
			message: isSelfLeave ? 'Вы покинули команду' : 'Участник успешно исключён',
			success: true,
		}
	}
}
