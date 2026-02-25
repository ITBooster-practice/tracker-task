'use client'

import { useFormContext } from 'react-hook-form'

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	VStack,
} from '@repo/ui'

import { RegisterFormValues } from './use-register-form'

const RegisterForm = () => {
	const { control } = useFormContext<RegisterFormValues>()

	return (
		<VStack>
			<FormField
				control={control}
				name='email'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Почта</FormLabel>
						<FormControl>
							<Input {...field} autoComplete='off' />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name='name'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Имя</FormLabel>
						<FormControl>
							<Input {...field} autoComplete='off' />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name='password'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Пароль</FormLabel>
						<FormControl>
							<Input {...field} type='password' autoComplete='new-password' />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name='confirmPassword'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Подтверждение пароля</FormLabel>
						<FormControl>
							<Input {...field} type='password' autoComplete='new-password' />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</VStack>
	)
}

export { RegisterForm }
