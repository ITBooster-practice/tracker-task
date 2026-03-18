import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MAIL_PROVIDER, RESEND_CLIENT } from './mail.constants'
import { ConfigService } from '@nestjs/config'
import { ResendMailProvider } from './providers/resend-mail.provider'
import { Resend } from 'resend'
@Module({
	providers: [
		MailService,
		{
			provide: MAIL_PROVIDER,
			useClass: ResendMailProvider,
		},
		{
			provide: RESEND_CLIENT,
			useFactory: (configService: ConfigService) =>
				new Resend(configService.getOrThrow('RESEND_API_KEY')),
			inject: [ConfigService],
		},
	],
	exports: [MailService],
})
export class MailModule {}
