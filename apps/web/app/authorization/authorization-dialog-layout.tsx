import type { ReactNode } from 'react'

import { DialogFooter, DialogHeader, DialogTitle } from '@repo/ui'

interface AuthorizationDialogLayoutProps {
	children?: ReactNode
	footer?: ReactNode
}

const AuthorizationDialogLayout = (props: AuthorizationDialogLayoutProps) => {
	const { children, footer } = props

	return (
		<>
			<DialogHeader>
				<DialogTitle>Авторизация</DialogTitle>
			</DialogHeader>
			{children}
			<DialogFooter>{footer}</DialogFooter>
		</>
	)
}

export { AuthorizationDialogLayout }
