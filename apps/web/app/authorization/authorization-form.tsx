import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { AuthorizationFormValues } from './use-authorization-form'

const AuthorizationForm = () => {
	const { control } = useFormContext<AuthorizationFormValues>()

	return (
		<div className='py-4 grid gap-2'>
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
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	)
}

export { AuthorizationForm }
