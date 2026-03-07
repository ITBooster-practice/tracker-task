import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_CLIENT } from './redis.module'
import { parseTTLToMs } from 'src/utils/ms.util'

@Injectable()
export class RedisService {
	private readonly ttlSeconds: number

	constructor(
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
		private readonly configService: ConfigService,
	) {
		const ttl = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL')
		this.ttlSeconds = parseTTLToMs(ttl) / 1000
	}

	async setRefreshToken(userId: string, token: string): Promise<void> {
		await this.redis.set(`refresh:${userId}`, token, 'EX', this.ttlSeconds)
	}

	async getRefreshToken(userId: string): Promise<string | null> {
		return this.redis.get(`refresh:${userId}`)
	}

	async deleteRefreshToken(userId: string): Promise<void> {
		await this.redis.del(`refresh:${userId}`)
	}
}
