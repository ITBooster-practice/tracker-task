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

const LoginForm = () => {
	const { control } = useFormContext()

	return (
		<VStack>
			<FormField
				control={control}
				name='email'
				render={({ field }) => (
					<FormItem>
						<FormLabel>Почта</FormLabel>
						<FormControl>
							<Input {...field} />
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
							<Input {...field} type='password' />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</VStack>
	)
}

export { LoginForm }
