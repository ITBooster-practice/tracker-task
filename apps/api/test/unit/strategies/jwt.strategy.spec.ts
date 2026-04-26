import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtStrategy } from '../../../src/strategies/jwt.strategy'

describe('JwtStrategy', () => {
	let strategy: JwtStrategy
	let authService: {
		validateUser: ReturnType<typeof vi.fn>
	}
	let configService: ConfigService

	beforeEach(() => {
		vi.clearAllMocks()
		authService = {
			validateUser: vi.fn(),
		}

		configService = {
			getOrThrow: vi.fn().mockReturnValue('test-secret'),
		} as unknown as ConfigService

		strategy = new JwtStrategy(authService as never, configService)
	})

	it('использует JWT_SECRET из конфигурации в конструкторе', () => {
		expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET')
	})

	it('validate делегирует проверку пользователя в AuthService', async () => {
		authService.validateUser.mockResolvedValue({ id: 'user-1' })

		const result = await strategy.validate({ id: 'user-1', email: 'a@b.c' } as never)

		expect(result).toEqual({ id: 'user-1' })
		expect(authService.validateUser).toHaveBeenCalledWith('user-1')
	})
})
