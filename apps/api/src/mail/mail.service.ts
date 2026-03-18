import { Inject, Injectable } from '@nestjs/common'
import type { MailProvider } from './mail.provider'
import { MAIL_PROVIDER } from './mail.constants'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MailService {
	constructor(
		@Inject(MAIL_PROVIDER)
		private readonly mailProvider: MailProvider,
		private readonly configService: ConfigService,
	) {}

	async sendWelcomeEmail(email: string) {
		const name = this.configService.getOrThrow('MAIL_FROM_NAME')
		const address = this.configService.getOrThrow('MAIL_FROM')

		await this.mailProvider.send({
			from: `${name} <${address}>`,
			to: email,
			subject: 'Добро пожаловать',
			text: 'Вы зарегистрированы',
		})
	}
}
