import { Inject, Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import type { MailProvider } from '../mail.provider'
import type { MailPayload } from '../mail.types'
import { RESEND_CLIENT } from '../mail.constants'

@Injectable()
export class ResendMailProvider implements MailProvider {
	constructor(@Inject(RESEND_CLIENT) private readonly resend: Resend) {}

	async send(payload: MailPayload): Promise<void> {
		await this.resend.emails.send({
			from: payload.from,
			to: payload.to,
			subject: payload.subject,
			html: payload.html,
		})
	}
}
