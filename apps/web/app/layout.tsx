import type { Metadata } from 'next'

import '@repo/ui/globals.css'

import { Toaster } from '@repo/ui'

import { DEFAULT_THEME, themeBootstrapScript } from '@/features/theme/bootstrap'

import { Providers } from './providers'

export const metadata: Metadata = {
	title: 'Tracker Task - Открытая система управления IT-проектами',
	description:
		'Лёгкая, современная альтернатива Jira и Яндекс.Трекер для разработчиков и небольших команд. Open-source решение для управления проектами, спринтами и задачами.',
	icons: {
		icon: '/favicon.svg',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='ru'
			className={DEFAULT_THEME}
			style={{ colorScheme: DEFAULT_THEME }}
			suppressHydrationWarning
		>
			<head>
				<script
					id='theme-bootstrap'
					dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
				/>
			</head>
			<body>
				<Providers>{children}</Providers>
				<Toaster />
			</body>
		</html>
	)
}
