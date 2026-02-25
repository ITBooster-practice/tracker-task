'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z
	.object({
		email: z.email({
			message: 'Пожалуйста, введите правильный адрес электронной почты.',
		}),
		name: z.string().min(2, {
			message: 'Имя должно содержать не менее 2 символов.',
		}),
		password: z.string().min(8, {
			message: 'Пароль должен содержать не менее 8 символов.',
		}),
		confirmPassword: z.string().min(8, {
			message: 'Пароль должен содержать не менее 8 символов.',
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают.',
		path: ['confirmPassword'],
	})

export type RegisterFormValues = z.infer<typeof formSchema>

const useRegisterForm = () =>
	useForm<RegisterFormValues>({
		resolver: standardSchemaResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
			name: '',
		},
	})

export { useRegisterForm }
