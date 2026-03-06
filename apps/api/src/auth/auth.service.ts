import { hash, verify } from 'argon2'
import { ConfigService } from '@nestjs/config'
import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request, Response } from 'express'

import { RegisterRequestDto } from './dto/register.dto'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtPayload } from './interfaces/jwt.interface'
import { LoginRequestDto } from './dto/login.dto'
import { isDev } from 'src/utils/is-dev.util'
import { parseTTLToMs } from 'src/utils/ms.util'

@Injectable()
export class AuthService {
	private readonly JWT_ACCESS_TOKEN_TTL
	private readonly JWT_REFRESH_TOKEN_TTL
	private readonly COOKIE_DOMAIN: string
	private readonly COOKIE_TTL: string

	constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {
		this.JWT_ACCESS_TOKEN_TTL =
			this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL')
		this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>(
			'JWT_REFRESH_TOKEN_TTL',
		)
		this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN')
		this.COOKIE_TTL = this.configService.getOrThrow<string>('COOKIES_TTL')
	}

	async register(res: Response, dto: RegisterRequestDto) {
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

		return this.auth(res, user.id)
	}

	async login(res: Response, dto: LoginRequestDto) {
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

		return this.auth(res, user.id)
	}

	async refresh(req: Request, res: Response) {
		const refreshToken: string = req.cookies['refreshToken']

		if (!refreshToken) {
			throw new UnauthorizedException('Недействительный refresh-токен')
		}

		const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken)

		if (payload) {
			const user = await this.prismaService.user.findUnique({
				where: {
					id: payload.id,
				},
				select: {
					id: true,
				},
			})

			if (!user) {
				throw new NotFoundException('Пользователь не найден')
			}

			return this.auth(res, user.id)
		}
	}

	async logout(res: Response) {
		this.setCookie(res, 'refreshToken', new Date(0))

		return { message: 'Пользователь успешно вышел', success: true }
	}

	private auth(res: Response, userId: string) {
		const { accessToken, refreshToken } = this.generateTokens(userId)

		this.setCookie(
			res,
			refreshToken,
			new Date(Date.now() + parseTTLToMs(this.COOKIE_TTL)),
		)

		return { accessToken }
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

	private setCookie(res: Response, value: string, expires: Date) {
		res.cookie('refreshToken', value, {
			httpOnly: true,
			secure: !isDev(this.configService),
			sameSite: isDev(this.configService) ? 'none' : 'lax',
			domain: this.COOKIE_DOMAIN,
			expires,
		})
	}
}
