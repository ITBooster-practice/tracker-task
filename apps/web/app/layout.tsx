import type { Metadata } from 'next'

import '@repo/ui/globals.css'

import { Toaster } from '@repo/ui'

import { Providers } from './providers'

export const metadata: Metadata = {
	title: 'Tracker Task - Открытая система управления IT-проектами',
	description:
		'Лёгкая, современная альтернатива Jira и Яндекс.Трекер для разработчиков и небольших команд. Open-source решение для управления проектами, спринтами и задачами.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='ru' className='dark' suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
				<Toaster />
			</body>
		</html>
	)
}
