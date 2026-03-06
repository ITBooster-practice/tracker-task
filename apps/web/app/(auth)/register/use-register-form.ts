'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'

import {
	RegisterRequestWithConfirmPassword,
	registerRequestWithConfirmPasswordSchema,
} from '@repo/types'

export type RegisterFormValues = RegisterRequestWithConfirmPassword

const useRegisterForm = () =>
	useForm<RegisterRequestWithConfirmPassword>({
		resolver: standardSchemaResolver(registerRequestWithConfirmPasswordSchema),
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
			name: '',
		},
	})

export { useRegisterForm }
