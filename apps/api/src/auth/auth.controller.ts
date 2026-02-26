import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterRequestDto } from './dto/register.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

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
}
