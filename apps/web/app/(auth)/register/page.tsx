'use client'

import Link from 'next/link'

import { Button, Form } from '@repo/ui'

import { AuthFormLayout } from '../auth-form-layout'
import { RegisterForm } from './register-form'
import { RegisterFormValues, useRegisterForm } from './use-register-form'

export default function RegisterPage() {
	const form = useRegisterForm()

	const onSubmit = async (data: RegisterFormValues) => {
		console.log(data)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-sm'>
				<AuthFormLayout
					title='Регистрация'
					footer={
						<Button
							disabled={form.formState.isSubmitting}
							type='submit'
							variant='default'
							className='w-full'
						>
							Зарегистрироваться
						</Button>
					}
				>
					<div className='space-y-4'>
						<RegisterForm />
						<p className='text-center text-sm text-muted-foreground'>
							Уже есть аккаунт?{' '}
							<Link
								href='/login'
								className='font-medium text-primary transition-opacity hover:opacity-80'
							>
								Войти
							</Link>
						</p>
					</div>
				</AuthFormLayout>
			</form>
		</Form>
	)
}
