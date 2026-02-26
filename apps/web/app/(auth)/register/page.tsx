'use client'

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
					<RegisterForm />
				</AuthFormLayout>
			</form>
		</Form>
	)
}
