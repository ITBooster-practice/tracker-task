import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterRequest, registerRequestSchema } from '@repo/api'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@UsePipes(new ZodValidationPipe(registerRequestSchema))
	async register(@Body() dto: RegisterRequest) {
		return this.authService.register(dto)
	}
}
