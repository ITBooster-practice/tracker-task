'use client'

import { useLogout } from '@/hooks/api/use-auth'
import { ROUTES } from '@/shared/config/routes'
import { useRouter } from 'next/navigation'
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

const currentUser = {
	name: 'Имя',
	avatar: 'AL',
}

const ProfileMenu = () => {
	const router = useRouter()
	const logoutMutation = useLogout()

	const handleLogout = async () => {
		await logoutMutation.mutateAsync()

		router.push(ROUTES.login)
	}

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
							{currentUser.name}
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
