import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { RegisterRequestDto } from './dto/register.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LoginRequestDto } from './dto/login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Регистрация нового пользователя' })
	@ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
	@ApiResponse({ status: 400, description: 'Некорректные данные' })
	async register(
		@Res({ passthrough: true }) res: Response,
		@Body() dto: RegisterRequestDto,
	) {
		return this.authService.register(res, dto)
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiResponse({ status: 200, description: 'Пользователь успешно вошел' })
	@ApiResponse({ status: 400, description: 'Некорректные данные' })
	async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginRequestDto) {
		return this.authService.login(res, dto)
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Обновление токена' })
	@ApiResponse({ status: 200, description: 'Токен успешно обновлен' })
	@ApiResponse({ status: 400, description: 'Некорректные данные' })
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		return this.authService.refresh(req, res)
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Выход пользователя' })
	@ApiResponse({ status: 200, description: 'Пользователь успешно вышел' })
	async logout(@Res({ passthrough: true }) res: Response) {
		return this.authService.logout(res)
	}
}
