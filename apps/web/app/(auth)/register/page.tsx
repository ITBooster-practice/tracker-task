'use client'

import { Button, Form } from '@repo/ui'

import { AuthFormLayout } from '../auth-form-layout'
import { RegisterForm } from './register-form'
import { useRegisterForm } from './use-register-form'

export default function RegisterPage() {
	const form = useRegisterForm()

	return (
		<Form {...form}>
			<AuthFormLayout
				title='Регистрация'
				footer={
					<Button type='submit' variant='default' className='w-full'>
						Зарегистрироваться
					</Button>
				}
			>
				<RegisterForm />
			</AuthFormLayout>
		</Form>
	)
}
