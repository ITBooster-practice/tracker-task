'use client'

import React from 'react'
import { Button } from '@repo/ui/components/button'
import { Dialog, DialogContent, DialogTrigger } from '@repo/ui/components/dialog'
import { Form } from '@repo/ui/components/form'
import { AuthorizationForm } from './authorization-form'
import { AuthorizationDialogLayout } from './authorization-dialog-layout'
import { useAuthorizationForm } from './use-authorization-form'

const AuthorizationDialog = () => {
	const form = useAuthorizationForm()

	const { handleSubmit, formState } = form

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='outline'>Авторизация</Button>
			</DialogTrigger>
			<DialogContent>
				<Form {...form}>
					<form
						onSubmit={handleSubmit(async () => {
							await new Promise((resolve) => setTimeout(resolve, 1000))
							alert('Выполняется авторизация')
						})}
					>
						<AuthorizationDialogLayout
							footer={
								<Button
									type='submit'
									variant='secondary'
									disabled={formState.isSubmitting}
								>
									Войти
								</Button>
							}
						>
							<AuthorizationForm />
						</AuthorizationDialogLayout>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

export { AuthorizationDialog }
