import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'

export async function redisConfig(configService: ConfigService): Promise<Redis> {
	return new Redis(configService.getOrThrow<string>('REDIS_URL'))
}
