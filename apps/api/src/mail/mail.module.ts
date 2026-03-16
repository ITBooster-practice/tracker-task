import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MAIL_PROVIDER } from './mail.constants'
import { BrevoMailProvider } from './providers/brevo-mail.provider'
import { MailerModule } from '@nestjs-modules/mailer'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getMailConfig } from './config/mail.config'

@Module({
	providers: [
		MailService,
		{
			provide: MAIL_PROVIDER,
			useClass: BrevoMailProvider,
		},
	],
	imports: [
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const { host, port, secure, auth, from } = getMailConfig(configService)

				return {
					transport: {
						host,
						port,
						secure,
						auth,
					},
					defaults: {
						from: `${from.name} <${from.address}>`,
					},
				}
			},
		}),
	],
	exports: [MailService],
})
export class MailModule {}
