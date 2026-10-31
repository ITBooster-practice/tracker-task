'use client'

import { useIsMutating, useQueryClient } from '@tanstack/react-query'

import {
	Button,
	toast,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@repo/ui'
import { LogOut } from '@repo/ui/icons'

import { authKeys, useLogout } from '@/shared/api/use-auth'

interface LogoutButtonProps {
	iconOnly?: boolean
}

export function LogoutButton({ iconOnly = false }: LogoutButtonProps) {
	const logout = useLogout()
	const queryClient = useQueryClient()
	const pending = useIsMutating({ mutationKey: authKeys.logout }) > 0
	const button = (
		<Button
			type='button'
			variant={iconOnly ? 'ghost' : 'outline'}
			size={iconOnly ? 'icon-sm' : 'default'}
			aria-label='Выйти'
			aria-busy={pending}
			disabled={pending}
			onClick={() => {
				if (queryClient.isMutating({ mutationKey: authKeys.logout }) > 0) return
				logout.mutate(undefined, {
					onError: () => toast.error('Не удалось выйти. Попробуйте ещё раз.'),
				})
			}}
		>
			<LogOut className='size-4' />
			{!iconOnly && 'Выйти'}
		</Button>
	)

	return iconOnly ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent side='right' sideOffset={4}>
					Выйти
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		button
	)
}
