'use client'

import React from 'react'

import {
	Avatar,
	AvatarFallback,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui'

import { useLogout, useMe } from '@/shared/api/use-auth'
import { ROUTE_QUERY_PARAMS, ROUTES } from '@/shared/config'

const currentUser = {
	name: 'Имя',
	avatar: 'AL',
}

const ProfileMenu = () => {
	const logoutMutation = useLogout()

	const handleLogout = () => {
		logoutMutation.mutateAsync()
		const url = new URL(ROUTES.login, window.location.origin)
		url.searchParams.set(ROUTE_QUERY_PARAMS.clearAuth, '1')
		window.location.assign(url)
	}

	const profileQuery = useMe()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-9 gap-2 px-2'>
					<Avatar size='sm'>
						<AvatarFallback>{currentUser.avatar}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-48'>
				<DropdownMenuLabel className='py-2'>
					<div className='flex items-center gap-2'>
						<Avatar size='sm'>
							<AvatarFallback>{currentUser.avatar}</AvatarFallback>
						</Avatar>
						<span className='text-sm font-medium text-foreground'>
							{profileQuery.data?.name}
						</span>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Профиль</DropdownMenuItem>
				<DropdownMenuItem>Настройки</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant='destructive' onClick={handleLogout}>
					Выйти
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export { ProfileMenu }
