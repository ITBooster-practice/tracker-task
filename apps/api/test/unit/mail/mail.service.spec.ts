import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@react-email/render', () => ({
	render: vi.fn().mockResolvedValue('<html>email</html>'),
}))

vi.mock('../../../src/mail/templates/welcome.email', () => ({
	WELCOME_EMAIL_SUBJECT: 'Добро пожаловать в Tracker Task',
	WelcomeEmail: vi.fn().mockReturnValue(null),
}))

vi.mock('../../../src/mail/templates/team-invitation.email', () => ({
	TeamInvitationEmail: vi.fn().mockReturnValue(null),
}))

import { MailService } from '../../../src/mail/mail.service'
import {
	TEAM_INVITATION_EMAIL_SUBJECT,
	TEAM_INVITATION_EXPIRES_IN_LABEL,
} from '../../../src/common/constants/invitations.constants'
import { WelcomeEmail } from '../../../src/mail/templates/welcome.email'
import { WELCOME_EMAIL_SUBJECT } from '../../../src/mail/templates/welcome.email'
import { TeamInvitationEmail } from '../../../src/mail/templates/team-invitation.email'

describe('MailService', () => {
	let service: MailService
	let mailProvider: { send: ReturnType<typeof vi.fn> }
	let configService: ConfigService

	beforeEach(() => {
		vi.clearAllMocks()
		mailProvider = {
			send: vi.fn().mockResolvedValue(undefined),
		}

		configService = {
			getOrThrow: vi.fn((key: string) => {
				const values: Record<string, string> = {
					MAIL_FROM_NAME: 'Tracker Task',
					MAIL_FROM: 'noreply@tracker.test',
					WEB_APP_URL: 'https://tracker.test',
				}
				return values[key]
			}),
		} as unknown as ConfigService

		service = new MailService(mailProvider as never, configService)
	})

	it('sendWelcomeEmail отправляет welcome-письмо', async () => {
		await service.sendWelcomeEmail('user@test.dev', 'Alice')

		expect(WelcomeEmail).toHaveBeenCalledWith({ name: 'Alice' })
		expect(mailProvider.send).toHaveBeenCalledOnce()
		expect(mailProvider.send).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'Tracker Task <noreply@tracker.test>',
				to: 'user@test.dev',
				subject: WELCOME_EMAIL_SUBJECT,
				html: expect.any(String),
			}),
		)
	})

	it('sendTeamInvitationEmail отправляет инвайт с ссылкой и именем по умолчанию', async () => {
		await service.sendTeamInvitationEmail(
			'user@test.dev',
			'Core Team',
			null,
			'invite-token',
		)

		expect(TeamInvitationEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				teamName: 'Core Team',
				inviterName: 'Участник команды',
				invitationLink: 'https://tracker.test/invitations/invite-token',
				expiresIn: TEAM_INVITATION_EXPIRES_IN_LABEL,
			}),
		)
		expect(mailProvider.send).toHaveBeenCalledOnce()
		expect(mailProvider.send).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'Tracker Task <noreply@tracker.test>',
				to: 'user@test.dev',
				subject: TEAM_INVITATION_EMAIL_SUBJECT,
				html: '<html>email</html>',
			}),
		)
	})

	it('sendTeamInvitationEmail использует имя инвайтера, если оно передано', async () => {
		await service.sendTeamInvitationEmail(
			'user@test.dev',
			'Core Team',
			'Bob',
			'invite-token',
		)

		expect(TeamInvitationEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				teamName: 'Core Team',
				inviterName: 'Bob',
				invitationLink: 'https://tracker.test/invitations/invite-token',
				expiresIn: TEAM_INVITATION_EXPIRES_IN_LABEL,
			}),
		)
		expect(configService.getOrThrow).toHaveBeenCalledWith('WEB_APP_URL')
		expect(mailProvider.send).toHaveBeenCalledWith(
			expect.objectContaining({
				html: '<html>email</html>',
			}),
		)
		expect(TEAM_INVITATION_EXPIRES_IN_LABEL.length).toBeGreaterThan(0)
	})
})
