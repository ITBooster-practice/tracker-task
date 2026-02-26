'use client'

import { Button, Form } from '@repo/ui'

import { AuthFormLayout } from '../auth-form-layout'
import { LoginForm } from './login-form'
import { LoginFormValues, useLoginForm } from './use-login-form'

export default function LoginPage() {
	const form = useLoginForm()

	const onSubmit = async (data: LoginFormValues) => {
		console.log(data)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-sm'>
				<AuthFormLayout
					title='Войдите в свой аккаунт'
					footer={
						<Button
							disabled={form.formState.isSubmitting}
							type='submit'
							variant='default'
							className='w-full'
						>
							Войти
						</Button>
					}
				>
					<LoginForm />
				</AuthFormLayout>
			</form>
		</Form>
	)
}
