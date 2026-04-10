import { Inject, Injectable } from '@nestjs/common'
import type { MailProvider } from './mail.provider'
import { MAIL_PROVIDER } from './mail.constants'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/render'
import {
	TEAM_INVITATION_EMAIL_SUBJECT,
	TEAM_INVITATION_EXPIRES_IN_LABEL,
} from '../common/constants/invitations.constants'
import { TeamInvitationEmail } from './templates/team-invitation.email'
import { WELCOME_EMAIL_SUBJECT, WelcomeEmail } from './templates/welcome.email'

@Injectable()
export class MailService {
	constructor(
		@Inject(MAIL_PROVIDER)
		private readonly mailProvider: MailProvider,
		private readonly configService: ConfigService,
	) {}

	private getMailFrom() {
		const mailName = this.configService.getOrThrow('MAIL_FROM_NAME')
		const mailAddress = this.configService.getOrThrow('MAIL_FROM')

		return `${mailName} <${mailAddress}>`
	}

	async sendWelcomeEmail(email: string, name: string) {
		const html = await render(WelcomeEmail({ name }))

		await this.mailProvider.send({
			from: this.getMailFrom(),
			to: email,
			subject: WELCOME_EMAIL_SUBJECT,
			html,
		})
	}

	async sendTeamInvitationEmail(
		email: string,
		teamName: string,
		inviterName: string | null,
		token: string,
	) {
		const webAppUrl = this.configService.getOrThrow<string>('WEB_APP_URL')
		const invitationLink = new URL(`/invitations/${token}`, webAppUrl).toString()
		const inviterDisplayName = inviterName ?? 'Участник команды'

		const html = await render(
			TeamInvitationEmail({
				teamName,
				inviterName: inviterDisplayName,
				invitationLink,
				expiresIn: TEAM_INVITATION_EXPIRES_IN_LABEL,
			}),
		)

		await this.mailProvider.send({
			from: this.getMailFrom(),
			to: email,
			subject: TEAM_INVITATION_EMAIL_SUBJECT,
			html,
		})
	}
}
