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
	name: string
}

export const WELCOME_EMAIL_SUBJECT = 'Добро пожаловать в Tracker Task'

export const WelcomeEmail = ({ name }: Props) => (
	<Html lang='ru'>
		<Head />
		<Preview>Рады видеть тебя в Tracker Task, {name}!</Preview>
		<Body style={body}>
			<Container style={container}>
				<Section style={logoSection}>
					<Text style={logo}>Tracker Task</Text>
				</Section>

				<Section style={content}>
					<Heading style={heading}>Привет, {name}! 👋</Heading>

					<Text style={paragraph}>
						Твой аккаунт успешно создан. Теперь ты можешь управлять задачами, создавать
						проекты и работать в команде.
					</Text>

					<Text style={paragraph}>Начни прямо сейчас:</Text>

					<Section style={buttonSection}>
						{/* Заменить href позже на реальный url */}
						<Button style={button} href='http://localhost:3000'>
							Открыть Tracker Task
						</Button>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						Если ты не регистрировался — просто проигнорируй это письмо.
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
