import type { MailPayload } from './mail.types'

export interface MailProvider {
	send(payload: MailPayload): Promise<void>
}
