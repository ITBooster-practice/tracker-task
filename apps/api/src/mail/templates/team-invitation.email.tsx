import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from '@react-email/components'

interface Props {
	teamName: string
	inviterName: string
	invitationLink: string
	expiresIn: string
}

export const TeamInvitationEmail = ({
	teamName,
	inviterName,
	invitationLink,
	expiresIn,
}: Props) => (
	<Html lang='ru'>
		<Head />
		<Preview>Приглашение в команду {teamName} ждёт вашего подтверждения</Preview>
		<Body style={body}>
			<Container style={container}>
				<Section style={logoSection}>
					<Text style={logo}>Tracker Task</Text>
				</Section>

				<Section style={content}>
					<Heading style={heading}>Приглашение в команду</Heading>

					<Text style={paragraph}>
						{inviterName} приглашает вас присоединиться к команде {teamName}.
					</Text>

					<Text style={paragraph}>
						Откройте приглашение по кнопке ниже. Оно действует {expiresIn}.
					</Text>

					<Section style={buttonSection}>
						<Button style={button} href={invitationLink}>
							Открыть приглашение
						</Button>
					</Section>

					<Text style={linkText}>{invitationLink}</Text>

					<Hr style={hr} />

					<Text style={footer}>
						Если вы не ожидали это письмо, просто проигнорируйте его.
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
)

const body = {
	backgroundColor: '#f6f9fc',
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
	margin: '40px auto',
	maxWidth: '560px',
}

const logoSection = {
	padding: '32px 40px 0',
}

const logo = {
	fontSize: '20px',
	fontWeight: '700',
	color: '#1a1a1a',
	margin: '0',
}

const content = {
	backgroundColor: '#ffffff',
	borderRadius: '12px',
	padding: '40px',
	marginTop: '16px',
	boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const heading = {
	fontSize: '24px',
	fontWeight: '700',
	color: '#1a1a1a',
	margin: '0 0 20px',
}

const paragraph = {
	fontSize: '16px',
	lineHeight: '24px',
	color: '#4a5568',
	margin: '0 0 16px',
}

const buttonSection = {
	margin: '28px 0',
}

const button = {
	backgroundColor: '#1a1a1a',
	borderRadius: '8px',
	color: '#ffffff',
	fontSize: '15px',
	fontWeight: '600',
	padding: '14px 28px',
	textDecoration: 'none',
	display: 'inline-block',
}

const linkText = {
	fontSize: '13px',
	lineHeight: '20px',
	color: '#718096',
	wordBreak: 'break-all' as const,
	margin: '0 0 16px',
}

const hr = {
	border: 'none',
	borderTop: '1px solid #e2e8f0',
	margin: '28px 0 20px',
}

const footer = {
	fontSize: '13px',
	color: '#a0aec0',
	margin: '0',
}
