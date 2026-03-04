import { hash, verify } from 'argon2'
import { ConfigService } from '@nestjs/config'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { RegisterRequestDto } from './dto/register.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtPayload } from './interfaces/jwt.interface'
import { LoginRequestDto } from './dto/login.dto'

@Injectable()
export class AuthService {
	private readonly JWT_SECRET: string
	private readonly JWT_ACCESS_TOKEN_TTL
	private readonly JWT_REFRESH_TOKEN_TTL

	constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {
		this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET')
		this.JWT_ACCESS_TOKEN_TTL =
			this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL')
		this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>(
			'JWT_REFRESH_TOKEN_TTL',
		)
	}

	async register(dto: RegisterRequestDto) {
		const { name, email, password } = dto

		const existUser = await this.prismaService.user.findUnique({
			where: {
				email,
			},
		})

		if (existUser) {
			throw new ConflictException('Пользователь с таким email уже существует')
		}

		const user = await this.prismaService.user.create({
			data: {
				name,
				email,
				password: await hash(password),
			},
		})

		return this.generateTokens(user.id)
	}

	async login(dto: LoginRequestDto) {
		const { email, password } = dto

		const user = await this.prismaService.user.findUnique({
			where: {
				email,
			},
			select: {
				id: true,
				password: true,
			},
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		const isPasswordValid = await verify(user.password, password)

		if (!isPasswordValid) {
			throw new NotFoundException('Пользователь не найден')
		}

		return this.generateTokens(user.id)
	}

	private generateTokens(userId: string) {
		const payload: JwtPayload = { id: userId }

		const accessToken = this.jwtService.sign(payload, {
			expiresIn: this.JWT_ACCESS_TOKEN_TTL,
		})

		const refreshToken = this.jwtService.sign(payload, {
			expiresIn: this.JWT_REFRESH_TOKEN_TTL,
		})

		return { accessToken, refreshToken }
	}
}
