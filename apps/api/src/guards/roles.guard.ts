import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { User } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { ROLES_KEY, type TeamRole } from 'src/common/constants/roles.constants'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<TeamRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		])

		if (!requiredRoles || requiredRoles.length === 0) {
			return true
		}

		const request = context.switchToHttp().getRequest<Request>()
		const user = request.user as User
		const teamId = request.params['teamId']

		if (!user || !teamId) {
			throw new ForbiddenException('Недостаточно прав')
		}

		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: user.id } },
		})

		if (!member || !requiredRoles.includes(member.role as TeamRole)) {
			throw new ForbiddenException('Недостаточно прав')
		}

		return true
	}
}
