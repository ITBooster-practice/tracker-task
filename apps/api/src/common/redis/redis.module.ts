import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { redisConfig } from 'src/auth/config/redis.config'
import { RedisService } from './redis.service'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: redisConfig,
			inject: [ConfigService],
		},
	],
	exports: [RedisService],
})
export class RedisModule {}
