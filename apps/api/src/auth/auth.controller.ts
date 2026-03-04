import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
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
	async register(@Body() dto: RegisterRequestDto) {
		return this.authService.register(dto)
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiResponse({ status: 200, description: 'Пользователь успешно вошел' })
	@ApiResponse({ status: 400, description: 'Некорректные данные' })
	async login(@Body() dto: LoginRequestDto) {
		return this.authService.login(dto)
	}
}
