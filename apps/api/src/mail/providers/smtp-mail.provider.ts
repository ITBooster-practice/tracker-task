import { Inject, Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type { MailProvider } from '../mail.provider'
import type { MailPayload } from '../mail.types'
import { SMTP_TRANSPORT } from '../mail.constants'

@Injectable()
export class SmtpMailProvider implements MailProvider {
	constructor(
		@Inject(SMTP_TRANSPORT)
		private readonly transporter: nodemailer.Transporter,
	) {}

	async send(payload: MailPayload): Promise<void> {
		await this.transporter.sendMail({
			from: payload.from,
			to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
			subject: payload.subject,
			html: payload.html,
			text: payload.text,
		})
	}
}
