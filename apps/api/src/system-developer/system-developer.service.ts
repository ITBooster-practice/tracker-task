import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** SYSTEM_DEVELOPER is an installation permission, independent of team roles. */
@Injectable()
export class SystemDeveloperService {
	constructor(private readonly config: ConfigService) {}

	canManage(userId: string | undefined): boolean {
		const developerId = this.config.get<string>('SYSTEM_DEVELOPER_USER_ID')?.trim()
		return Boolean(developerId && userId && developerId === userId)
	}
}
