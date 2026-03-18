import { Inject, Injectable } from '@nestjs/common'
import type { MailProvider } from './mail.provider'
import { MAIL_PROVIDER } from './mail.constants'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/render'
import { WELCOME_EMAIL_SUBJECT, WelcomeEmail } from './templates/welcome.email'

@Injectable()
export class MailService {
	constructor(
		@Inject(MAIL_PROVIDER)
		private readonly mailProvider: MailProvider,
		private readonly configService: ConfigService,
	) {}

	async sendWelcomeEmail(email: string, name: string) {
		const mailName = this.configService.getOrThrow('MAIL_FROM_NAME')
		const mailAddress = this.configService.getOrThrow('MAIL_FROM')

		const html = await render(WelcomeEmail({ name }))

		await this.mailProvider.send({
			from: `${mailName} <${mailAddress}>`,
			to: email,
			subject: WELCOME_EMAIL_SUBJECT,
			html,
		})
	}
}
