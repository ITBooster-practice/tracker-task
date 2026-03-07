import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { redisConfig } from 'src/auth/config/redis.config'
import { RedisService } from './redis.service'
import { REDIS_CLIENT } from './redis.constants'

@Global()
@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: redisConfig,
			inject: [ConfigService],
		},
		RedisService,
	],
	exports: [RedisService],
})
export class RedisModule {}
