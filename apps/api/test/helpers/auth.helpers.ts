import { vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { Request, Response } from 'express'

import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../src/common/redis/redis.service'

// ── Token fixtures ─────────────────────────────────────────────────────────────
export const ACCESS_TOKEN = 'access.token'
export const REFRESH_TOKEN = 'refresh.token'

export const makeTokens = () => ({
	accessToken: ACCESS_TOKEN,
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
		verifyAsync: vi.fn(),
		decode: vi.fn(),
	}
	jwtService.sign.mockReturnValueOnce(ACCESS_TOKEN).mockReturnValueOnce(REFRESH_TOKEN)
	return jwtService as unknown as JwtService & {
		sign: ReturnType<typeof vi.fn>
		verifyAsync: ReturnType<typeof vi.fn>
		decode: ReturnType<typeof vi.fn>
	}
}

export function createConfigMock() {
	return {
		getOrThrow: vi.fn((key: string) => {
			const value = process.env[key]
			if (!value)
				throw new Error(`Переменная окружения "${key}" не найдена в тестовом окружении`)
			return value
		}),
	} as unknown as ConfigService
}

export function createRedisMock() {
	return {
		setRefreshToken: vi.fn().mockResolvedValue(undefined),
		deleteRefreshToken: vi.fn().mockResolvedValue(undefined),
		getRefreshToken: vi.fn(),
	} as unknown as RedisService & {
		setRefreshToken: ReturnType<typeof vi.fn>
		deleteRefreshToken: ReturnType<typeof vi.fn>
		getRefreshToken: ReturnType<typeof vi.fn>
	}
}

export function createResMock() {
	return {
		cookie: vi.fn(),
	} as unknown as Response
}

export function createReqMock(cookies: Record<string, string> = {}) {
	return { cookies } as unknown as Request
}
