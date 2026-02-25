'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui'

interface Props {
	title?: React.ReactNode
	children: React.ReactNode
	footer?: React.ReactNode
}

const AuthFormLayout = (props: Props) => {
	const { title, children, footer } = props

	return (
		<Card className='w-full max-w-sm'>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
			<CardFooter>{footer}</CardFooter>
		</Card>
	)
}

export { AuthFormLayout }
