import { vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { PrismaService } from '../../src/prisma/prisma.service'

// ── Token fixtures ─────────────────────────────────────────────────────────────
export const ACCESS_TOKEN = 'access.token'
export const REFRESH_TOKEN = 'refresh.token'

export const makeTokens = () => ({
	accessToken: ACCESS_TOKEN,
	refreshToken: REFRESH_TOKEN,
})

// ── Mock factories ─────────────────────────────────────────────────────────────
export function createPrismaMock() {
	return {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	} as unknown as PrismaService & {
		user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
	}
}

export function createJwtMock() {
	const jwtService = {
		sign: vi.fn(),
	}
	jwtService.sign.mockReturnValueOnce(ACCESS_TOKEN).mockReturnValueOnce(REFRESH_TOKEN)
	return jwtService as unknown as JwtService
}

export function createConfigMock() {
	return {
		getOrThrow: vi.fn((key: string) => {
			const map: Record<string, string> = {
				JWT_SECRET: 'test_secret',
				JWT_ACCESS_TOKEN_TTL: '15m',
				JWT_REFRESH_TOKEN_TTL: '7d',
			}
			return map[key]
		}),
	} as unknown as ConfigService
}
