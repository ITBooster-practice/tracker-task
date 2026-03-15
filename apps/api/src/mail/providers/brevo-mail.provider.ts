import { Injectable } from '@nestjs/common'
import { MailProvider } from '../mail.provider'
import type { MailPayload } from '../mail.types'

@Injectable()
export class BrevoMailProvider implements MailProvider {
	send(payload: MailPayload): Promise<void> {
		return Promise.resolve() // временная заглушка
	}
}
