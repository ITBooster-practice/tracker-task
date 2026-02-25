'use client'

import { Button, Form } from '@repo/ui'

import { AuthFormLayout } from '../auth-form-layout'
import { LoginForm } from './login-form'
import { useLoginForm } from './use-login-form'

export default function LoginPage() {
	const form = useLoginForm()

	return (
		<Form {...form}>
			<AuthFormLayout
				title='Войдите в свой аккаунт'
				footer={
					<Button type='submit' variant='default' className='w-full'>
						Войти
					</Button>
				}
			>
				<LoginForm />
			</AuthFormLayout>
		</Form>
	)
}
