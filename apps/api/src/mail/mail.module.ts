import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MAIL_PROVIDER } from './mail.constants'
import { BrevoMailProvider } from './providers/brevo-mail.provider'

@Module({
	providers: [
		MailService,
		{
			provide: MAIL_PROVIDER,
			useClass: BrevoMailProvider,
		},
	],
	exports: [MailService],
})
export class MailModule {}
