import { ConflictException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../../../src/auth/auth.service'
import {
	createConfigMock,
	createJwtMock,
	createPrismaMock,
	makeTokens,
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

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(hash).mockResolvedValue('hashed_password' as never)

		prisma = createPrismaMock()
		const jwt = createJwtMock()
		const config = createConfigMock()

		service = new AuthService(prisma, config, jwt)
	})

	// ── register ──────────────────────────────────────────────────────────────
	describe('register', () => {
		it('должен зарегистрировать нового пользователя и вернуть пару токенов', async () => {
			prisma.user.findUnique.mockResolvedValue(null)
			prisma.user.create.mockResolvedValue({ id: 'user-id-1' })

			const result = await service.register(REGISTER_DTO)

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

			await expect(service.register(REGISTER_DTO)).rejects.toThrow(ConflictException)
			await expect(service.register(REGISTER_DTO)).rejects.toThrow(
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

			const result = await service.login(LOGIN_DTO)

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

			await expect(service.login(LOGIN_DTO)).rejects.toThrow(NotFoundException)
			await expect(service.login(LOGIN_DTO)).rejects.toThrow('Пользователь не найден')

			expect(verify).not.toHaveBeenCalled()
		})

		it('должен выбросить NotFoundException при верном email, но неверном пароле', async () => {
			prisma.user.findUnique.mockResolvedValue(STORED_USER)
			vi.mocked(verify).mockResolvedValue(false as never)

			await expect(service.login(LOGIN_DTO)).rejects.toThrow(NotFoundException)
			await expect(service.login(LOGIN_DTO)).rejects.toThrow('Пользователь не найден')
		})
	})
})
