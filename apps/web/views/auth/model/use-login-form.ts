'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'

import { loginRequestSchema, type LoginRequest } from '@repo/types'

export type LoginFormValues = LoginRequest

const useLoginForm = () =>
	useForm<LoginFormValues>({
		resolver: standardSchemaResolver(loginRequestSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

export { useLoginForm }
