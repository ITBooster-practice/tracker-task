import { ConfigService } from '@nestjs/config'

export function getMailConfig(configService: ConfigService) {
	const host = configService.getOrThrow<string>('MAIL_HOST')
	const port = Number(configService.getOrThrow<string>('MAIL_PORT'))
	const secure = configService.getOrThrow<string>('MAIL_SECURE') === 'true'
	const user = configService.getOrThrow<string>('MAIL_USER')
	const pass = configService.getOrThrow<string>('MAIL_PASSWORD')
	const fromAddress = configService.getOrThrow<string>('MAIL_FROM')
	const fromName = configService.getOrThrow<string>('MAIL_FROM_NAME')

	return {
		host,
		port,
		secure,
		auth: {
			user,
			pass,
		},
		from: {
			name: fromName,
			address: fromAddress,
		},
	}
}
