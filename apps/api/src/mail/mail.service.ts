import { Inject, Injectable } from '@nestjs/common'
import type { MailProvider } from './mail.provider'
import { MAIL_PROVIDER } from './mail.constants'

@Injectable()
export class MailService {
	constructor(
		@Inject(MAIL_PROVIDER)
		private readonly mailProvider: MailProvider,
	) {}

	async sendWelcomeEmail(email: string) {
		await this.mailProvider.send({
			to: email,
			subject: 'Добро пожаловать',
			text: 'Вы зарегистрированы',
		})
	}
}
