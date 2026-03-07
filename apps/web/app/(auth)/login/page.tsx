'use client'

import Link from 'next/link'

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
					<div className='space-y-4'>
						<LoginForm />
						<p className='text-center text-sm text-muted-foreground'>
							Еще нет аккаунта?{' '}
							<Link
								href='/register'
								className='font-medium text-primary transition-opacity hover:opacity-80'
							>
								Зарегистрироваться
							</Link>
						</p>
					</div>
				</AuthFormLayout>
			</form>
		</Form>
	)
}
