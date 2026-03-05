import { ConfigService } from '@nestjs/config'

export const isDev = (configService: ConfigService) => {
	return configService.getOrThrow('NODE_ENV') === 'development'
}
