export type MailPayload = {
	from?: string
	to: string
	subject: string
	text?: string
	html?: string
}
