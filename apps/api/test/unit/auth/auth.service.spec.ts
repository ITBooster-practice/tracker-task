import {
	ConflictException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../../../src/auth/auth.service'
import {
	createConfigMock,
	createJwtMock,
	createRedisMock,
	createResMock,
	createReqMock,
	createPrismaMock,
	makeTokens,
	REFRESH_TOKEN,
} from '../../helpers/auth.helpers'

// ── argon2 mock ──────────────────────────────────────────────────────────────
vi.mock('argon2', async () => await import('../../mocks/argon2'))

import { hash, verify } from 'argon2'

// ── fixtures ─────────────────────────────────────────────────────────────────
const REGISTER_DTO = {
	name: 'Alice',
	email: 'alice@example.com',
	password: 'P@ssw0rd!',
}

const LOGIN_DTO = {
	email: 'alice@example.com',
	password: 'P@ssw0rd!',
}

const STORED_USER = { id: 'user-id-1', password: 'hashed_password' }

// ── suite ─────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
	let service: AuthService
	let prisma: ReturnType<typeof createPrismaMock>
	let redis: ReturnType<typeof createRedisMock>
	let jwt: ReturnType<typeof createJwtMock>
	let res: ReturnType<typeof createResMock>

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(hash).mockResolvedValue('hashed_password' as never)

		prisma = createPrismaMock()
		res = createResMock()
		jwt = createJwtMock()
		const config = createConfigMock()
		redis = createRedisMock()

		service = new AuthService(prisma, config, jwt, redis)
	})

	// ── register ──────────────────────────────────────────────────────────────
	describe('register', () => {
		it('должен зарегистрировать нового пользователя и вернуть пару токенов', async () => {
			prisma.user.findUnique.mockResolvedValue(null)
			prisma.user.create.mockResolvedValue({ id: 'user-id-1' })

			const result = await service.register(res, REGISTER_DTO)

			expect(prisma.user.findUnique).toHaveBeenCalledOnce()
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: REGISTER_DTO.email },
			})

			expect(hash).toHaveBeenCalledWith(REGISTER_DTO.password)

			expect(prisma.user.create).toHaveBeenCalledOnce()
			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					name: REGISTER_DTO.name,
					email: REGISTER_DTO.email,
					password: 'hashed_password',
				},
			})

			expect(result).toEqual(makeTokens())
		})

		it('должен выбросить ConflictException, если пользователь с таким email уже существует', async () => {
			prisma.user.findUnique.mockResolvedValue({
				id: 'existing-id',
				email: REGISTER_DTO.email,
			})

			await expect(service.register(res, REGISTER_DTO)).rejects.toThrow(ConflictException)
			await expect(service.register(res, REGISTER_DTO)).rejects.toThrow(
				'Пользователь с таким email уже существует',
			)

			expect(prisma.user.create).not.toHaveBeenCalled()
		})
	})

	// ── login ─────────────────────────────────────────────────────────────────
	describe('login', () => {
		it('должен выполнить вход и вернуть пару токенов при корректных учётных данных', async () => {
			prisma.user.findUnique.mockResolvedValue(STORED_USER)
			vi.mocked(verify).mockResolvedValue(true as never)

			const result = await service.login(res, LOGIN_DTO)

			expect(prisma.user.findUnique).toHaveBeenCalledOnce()
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: LOGIN_DTO.email },
				select: { id: true, password: true },
			})

			expect(verify).toHaveBeenCalledWith(STORED_USER.password, LOGIN_DTO.password)
			expect(result).toEqual(makeTokens())
		})

		it('должен выбросить NotFoundException, если пользователь с указанным email не найден', async () => {
			prisma.user.findUnique.mockResolvedValue(null)

			await expect(service.login(res, LOGIN_DTO)).rejects.toThrow(NotFoundException)
			await expect(service.login(res, LOGIN_DTO)).rejects.toThrow(
				'Пользователь не найден',
			)

			expect(verify).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException при верном email, но неверном пароле', async () => {
			prisma.user.findUnique.mockResolvedValue(STORED_USER)
			vi.mocked(verify).mockResolvedValue(false as never)

			await expect(service.login(res, LOGIN_DTO)).rejects.toThrow(NotFoundException)
			await expect(service.login(res, LOGIN_DTO)).rejects.toThrow(
				'Пользователь не найден',
			)
		})
	})

	// ── refresh ───────────────────────────────────────────────────────────────
	describe('refresh', () => {
		it('должен выдать новые токены при валидном refresh-токене', async () => {
			const req = createReqMock({ refreshToken: REFRESH_TOKEN })
			jwt.verifyAsync.mockResolvedValue({ id: 'user-id-1' })
			redis.getRefreshToken.mockResolvedValue(REFRESH_TOKEN)
			prisma.user.findUnique.mockResolvedValue({ id: 'user-id-1' })

			await service.refresh(req, res)

			expect(jwt.verifyAsync).toHaveBeenCalledWith(REFRESH_TOKEN)
			expect(redis.getRefreshToken).toHaveBeenCalledWith('user-id-1')
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-id-1' },
				select: { id: true },
			})
			// sign вызывается дважды: accessToken + refreshToken
			expect(jwt.sign).toHaveBeenCalledTimes(2)
			// новый refresh-токен сохраняется в Redis
			expect(redis.setRefreshToken).toHaveBeenCalledWith('user-id-1', REFRESH_TOKEN)
			expect(res.cookie).toHaveBeenCalledTimes(2)
		})

		it('должен выбросить UnauthorizedException если cookie refreshToken отсутствует', async () => {
			const req = createReqMock({})

			await expect(service.refresh(req, res)).rejects.toThrow(UnauthorizedException)
			await expect(service.refresh(req, res)).rejects.toThrow(
				'Недействительный refresh-токен',
			)
		})

		it('должен выбросить UnauthorizedException если токена нет в Redis', async () => {
			const req = createReqMock({ refreshToken: REFRESH_TOKEN })
			jwt.verifyAsync.mockResolvedValue({ id: 'user-id-1' })
			redis.getRefreshToken.mockResolvedValue(null)

			await expect(service.refresh(req, res)).rejects.toThrow(UnauthorizedException)
			await expect(service.refresh(req, res)).rejects.toThrow(
				'Недействительный refresh-токен',
			)
		})

		it('должен выбросить UnauthorizedException если токен не совпадает с сохранённым', async () => {
			const req = createReqMock({ refreshToken: REFRESH_TOKEN })
			jwt.verifyAsync.mockResolvedValue({ id: 'user-id-1' })
			redis.getRefreshToken.mockResolvedValue('other_token')

			await expect(service.refresh(req, res)).rejects.toThrow(UnauthorizedException)
			await expect(service.refresh(req, res)).rejects.toThrow(
				'Недействительный refresh-токен',
			)
		})

		it('должен выбросить NotFoundException если пользователь удалён из БД', async () => {
			const req = createReqMock({ refreshToken: REFRESH_TOKEN })
			jwt.verifyAsync.mockResolvedValue({ id: 'user-id-1' })
			redis.getRefreshToken.mockResolvedValue(REFRESH_TOKEN)
			prisma.user.findUnique.mockResolvedValue(null)

			await expect(service.refresh(req, res)).rejects.toThrow(NotFoundException)
			await expect(service.refresh(req, res)).rejects.toThrow('Пользователь не найден')
		})
	})

	// ── logout ────────────────────────────────────────────────────────────────
	describe('logout', () => {
		it('должен удалить refresh-токен из Redis и очистить cookies', async () => {
			const req = createReqMock({ refreshToken: REFRESH_TOKEN })
			jwt.decode.mockReturnValue({ id: 'user-id-1' })

			const result = await service.logout(req, res)

			expect(jwt.decode).toHaveBeenCalledWith(REFRESH_TOKEN)
			expect(redis.deleteRefreshToken).toHaveBeenCalledWith('user-id-1')
			expect(res.cookie).toHaveBeenCalledTimes(2)
			expect(res.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'',
				expect.objectContaining({ expires: new Date(0) }),
			)
			expect(res.cookie).toHaveBeenCalledWith(
				'accessToken',
				'',
				expect.objectContaining({ expires: new Date(0) }),
			)
			expect(result).toEqual({ message: 'Пользователь успешно вышел', success: true })
		})

		it('должен корректно завершиться если cookie refreshToken отсутствует', async () => {
			const req = createReqMock({})

			const result = await service.logout(req, res)

			expect(jwt.decode).not.toHaveBeenCalled()
			expect(redis.deleteRefreshToken).not.toHaveBeenCalled()
			expect(result).toEqual({ message: 'Пользователь успешно вышел', success: true })
		})
	})
})
