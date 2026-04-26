import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RedisService } from '../../../../src/common/redis/redis.service'

describe('RedisService', () => {
	const ttl = '7d'
	let service: RedisService
	let redis: {
		set: ReturnType<typeof vi.fn>
		get: ReturnType<typeof vi.fn>
		del: ReturnType<typeof vi.fn>
	}
	let configService: ConfigService

	beforeEach(() => {
		vi.clearAllMocks()
		redis = {
			set: vi.fn().mockResolvedValue('OK'),
			get: vi.fn(),
			del: vi.fn().mockResolvedValue(1),
		}

		configService = {
			getOrThrow: vi.fn().mockReturnValue(ttl),
		} as unknown as ConfigService

		service = new RedisService(redis as never, configService)
	})

	it('берет TTL из конфига при инициализации', () => {
		expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_TTL')
	})

	it('setRefreshToken сохраняет refresh-токен с EX и ttl в секундах', async () => {
		await service.setRefreshToken('user-1', 'token-1')

		expect(redis.set).toHaveBeenCalledWith('refresh:user-1', 'token-1', 'EX', 604800)
	})

	it('getRefreshToken читает refresh-токен по ключу пользователя', async () => {
		redis.get.mockResolvedValue('stored-token')

		const result = await service.getRefreshToken('user-2')

		expect(result).toBe('stored-token')
		expect(redis.get).toHaveBeenCalledWith('refresh:user-2')
	})

	it('deleteRefreshToken удаляет refresh-токен по ключу пользователя', async () => {
		await service.deleteRefreshToken('user-3')

		expect(redis.del).toHaveBeenCalledWith('refresh:user-3')
	})
})
