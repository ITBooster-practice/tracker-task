import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { RegisterRequestDto } from './dto/register.dto'
import {
	ApiTags,
	ApiOperation,
	ApiOkResponse,
	ApiConflictResponse,
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { LoginRequestDto } from './dto/login.dto'
import { AuthResponse } from './dto/auth.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiOperation({
		summary: 'Регистрация аккаунта',
		description: 'Регистрирует нового пользователя и возвращает токены',
	})
	@ApiOkResponse({
		type: AuthResponse,
		description: 'Пользователь успешно зарегистрирован',
	})
	@ApiConflictResponse({
		description: 'Пользователь с таким email уже существует',
		schema: {
			example: {
				statusCode: 409,
				error: 'Conflict',
				message: 'Пользователь с таким email уже существует',
			},
		},
	})
	@ApiBadRequestResponse({
		description: 'Некорректные данные',
		schema: {
			example: {
				statusCode: 400,
				path: ['email', 'password'],
				message: ['Email некорректный', 'Пароль должен быть строкой'],
			},
		},
	})
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Res({ passthrough: true }) res: Response,
		@Body() dto: RegisterRequestDto,
	) {
		return this.authService.register(res, dto)
	}

	@ApiOperation({
		summary: 'Вход пользователя',
		description: 'Выполняет аутентификацию пользователя и возвращает токены',
	})
	@ApiOkResponse({ type: AuthResponse, description: 'Пользователь успешно вошел' })
	@ApiConflictResponse({
		description: 'Пользователь с таким email уже существует',
		schema: {
			example: {
				statusCode: 409,
				error: 'Conflict',
				message: 'Пользователь с таким email уже существует',
			},
		},
	})
	@ApiNotFoundResponse({
		description: 'Пользователь не найден',
		schema: {
			example: {
				statusCode: 404,
				error: 'Not Found',
				message: 'Пользователь не найден',
			},
		},
	})
	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginRequestDto) {
		return this.authService.login(res, dto)
	}

	@ApiOperation({
		summary: 'Обновление токена',
		description: 'Обновляет access токен с помощью refresh токена',
	})
	@ApiOkResponse({ type: AuthResponse, description: 'Токен успешно обновлен' })
	@ApiUnauthorizedResponse({
		description: 'Недействительный refresh-токен',
		schema: {
			example: {
				statusCode: 401,
				error: 'Unauthorized',
				message: 'Недействительный refresh-токен',
			},
		},
	})
	@ApiBadRequestResponse({
		description: 'Некорректные данные',
		schema: { example: { statusCode: 400, message: 'Некорректные данные' } },
	})
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		return this.authService.refresh(req, res)
	}

	@ApiOperation({
		summary: 'Выход пользователя',
		description: 'Выполняет выход пользователя и удаляет токены',
	})
	@ApiOkResponse({ description: 'Пользователь успешно вышел' })
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Res({ passthrough: true }) res: Response) {
		return this.authService.logout(res)
	}
}
