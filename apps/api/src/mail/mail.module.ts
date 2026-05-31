import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MAIL_PROVIDER, RESEND_CLIENT, SMTP_TRANSPORT } from './mail.constants'
import { ConfigService } from '@nestjs/config'
import { ResendMailProvider } from './providers/resend-mail.provider'
import { SmtpMailProvider } from './providers/smtp-mail.provider'
import { Resend } from 'resend'
import * as nodemailer from 'nodemailer'

@Module({
	providers: [
		MailService,
		{
			// Выбираем провайдер по переменной MAIL_TRANSPORT:
			// smtp  → SmtpMailProvider (Mailpit, Mailtrap, любой SMTP)
			// resend (по умолчанию) → ResendMailProvider
			provide: MAIL_PROVIDER,
			useFactory: (configService: ConfigService) => {
				const transport = configService.get<string>('MAIL_TRANSPORT', 'resend')
				return transport === 'smtp'
					? new SmtpMailProvider(
							nodemailer.createTransport({
								host: configService.getOrThrow('MAIL_HOST'),
								port: configService.get<number>('MAIL_PORT', 1025),
								secure: false,
							}),
						)
					: new ResendMailProvider(new Resend(configService.getOrThrow('RESEND_API_KEY')))
			},
			inject: [ConfigService],
		},
		// Токены ниже оставлены для обратной совместимости —
		// в smtp-режиме не используются, но inject-декораторы в провайдерах
		// требуют их наличия в DI-контейнере.
		{
			provide: RESEND_CLIENT,
			useFactory: (configService: ConfigService) => {
				const key = configService.get<string>('RESEND_API_KEY', '')
				return key ? new Resend(key) : null
			},
			inject: [ConfigService],
		},
		{
			provide: SMTP_TRANSPORT,
			useFactory: (configService: ConfigService) =>
				nodemailer.createTransport({
					host: configService.get<string>('MAIL_HOST', 'localhost'),
					port: configService.get<number>('MAIL_PORT', 1025),
					secure: false,
				}),
			inject: [ConfigService],
		},
	],
	exports: [MailService],
})
export class MailModule {}
