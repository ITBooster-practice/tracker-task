import { Injectable } from '@nestjs/common'
import type { MailProvider } from '../mail.provider'
import type { MailPayload } from '../mail.types'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class BrevoMailProvider implements MailProvider {
	constructor(private readonly mailerService: MailerService) {}

	async send(payload: MailPayload): Promise<void> {
		await this.mailerService.sendMail(payload)
	}
}
