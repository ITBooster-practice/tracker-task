'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
	email: z.email({
		message: 'Пожалуйста, введите правильный адрес электронной почты.',
	}),
	password: z.string().min(8, {
		message: 'Пароль должен содержать не менее 8 символов.',
	}),
})

export type AuthorizationFormValues = z.infer<typeof formSchema>

const useAuthorizationForm = () =>
	useForm<AuthorizationFormValues>({
		resolver: standardSchemaResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

export { useAuthorizationForm }
