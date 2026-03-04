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
	Input,
} from '@repo/ui'

import { SidebarToggle } from './sidebar-toggle'

const Header = () => (
	<div className='flex h-14 items-center justify-between bg-background px-3 text-foreground'>
		<div className='flex items-center gap-2'>
			<SidebarToggle />
			<Input
				placeholder='Поиск (пока не реализовано)'
				className='h-9 w-[260px] md:w-[320px]'
			/>
		</div>
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-9 gap-2 px-2'>
					<Avatar size='sm'>
						<AvatarFallback>U</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-48'>
				<DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Профиль</DropdownMenuItem>
				<DropdownMenuItem>Настройки</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant='destructive'>Выйти</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
)

export { Header }
