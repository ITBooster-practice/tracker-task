'use client'

import { useRegister } from '@/hooks/api/use-auth'
import { isApiError } from '@/lib/api/utils'
import { useSessionStore } from '@/lib/session'
import { ROUTES } from '@/shared/config/routes'
import Link from 'next/link'

import { Button, Form, toast } from '@repo/ui'

import { AuthFormLayout } from '../auth-form-layout'
import { RegisterForm } from './register-form'
import { RegisterFormValues, useRegisterForm } from './use-register-form'

export default function RegisterPage() {
	const form = useRegisterForm()

	const registerMutation = useRegister()
	const session = useSessionStore()

	const onSubmit = async (data: RegisterFormValues) => {
		try {
			const { accessToken } = await registerMutation.mutateAsync(data)
			session.setAuthenticated(accessToken)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
			} else {
				throw error
			}
		}
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
								href={ROUTES.login}
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
