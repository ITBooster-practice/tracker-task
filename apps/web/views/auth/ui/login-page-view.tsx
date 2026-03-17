'use client'

import { useLogin } from '@/shared/api/use-auth'
import { ROUTES } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button, Form, toast } from '@repo/ui'

import { useLoginForm, type LoginFormValues } from '../model/use-login-form'
import { AuthFormLayout } from './auth-form-layout'
import { LoginForm } from './login-form'

function LoginPageView() {
	const form = useLoginForm()

	const loginMutation = useLogin()
	const router = useRouter()

	const onSubmit = async (data: LoginFormValues) => {
		try {
			await loginMutation.mutateAsync(data)
			router.push(ROUTES.teams)
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
								href={ROUTES.register}
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

export { LoginPageView }
