import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import type { Request } from 'express'
import { SystemDeveloperService } from './system-developer.service'

@Injectable()
export class SystemDeveloperGuard implements CanActivate {
	constructor(private readonly developer: SystemDeveloperService) {}
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>()
		const user = request.user as { id?: string } | undefined
		if (!this.developer.canManage(user?.id)) {
			throw new ForbiddenException('Управление доступно только разработчику системы')
		}
		return true
	}
}
