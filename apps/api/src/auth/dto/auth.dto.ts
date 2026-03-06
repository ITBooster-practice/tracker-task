import { ApiProperty } from '@nestjs/swagger'

export class AuthResponse {
	@ApiProperty({
		description: 'JWT access токен',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
	})
	accessToken: string
}
