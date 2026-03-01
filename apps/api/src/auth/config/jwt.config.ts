import { ConfigService } from '@nestjs/config'
import type { JwtModuleOptions } from '@nestjs/jwt'

export async function getJwtConfig(
	configService: ConfigService,
): Promise<JwtModuleOptions> {
	return {
		secret: configService.getOrThrow<string>('JWT_SECRET'),
		signOptions: {
			algorithm: 'HS256',
		},
	}
}
