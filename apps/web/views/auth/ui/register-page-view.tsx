'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button, Form, toast } from '@repo/ui'

import { useRegister } from '@/shared/api/use-auth'
import { buildLoginHref, getAuthRedirectPath, ROUTE_QUERY_PARAMS } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import { useRegisterForm, type RegisterFormValues } from '../model/use-register-form'
import { AuthFormLayout } from './auth-form-layout'
import { RegisterForm } from './register-form'

function RegisterPageView() {
	const form = useRegisterForm()

	const registerMutation = useRegister()
	const router = useRouter()
	const searchParams = useSearchParams()
	const redirectPath = getAuthRedirectPath(searchParams.get(ROUTE_QUERY_PARAMS.from))

	const onSubmit = async (data: RegisterFormValues) => {
		try {
			await registerMutation.mutateAsync(data)
			router.push(redirectPath)
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
								href={buildLoginHref(searchParams.get(ROUTE_QUERY_PARAMS.from))}
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

export { RegisterPageView }
