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
import { Bell } from '@repo/ui/icons'

import { MobileSidebarTrigger } from './mobile-sidebar-trigger'
import { SidebarToggle } from './sidebar-toggle'

const currentUser = {
	name: 'Имя',
	avatar: 'AL',
}

const Header = () => (
	<div className='flex h-14 items-center justify-between bg-background px-3 text-foreground'>
		<div className='flex min-w-0 items-center gap-2'>
			<div className='hidden md:block'>
				<SidebarToggle />
			</div>
			<nav
				aria-label='Breadcrumb'
				className='hidden items-center gap-2 text-sm text-muted-foreground md:flex'
			>
				<span>Главная</span>
				<span>/</span>
				<span className='text-foreground'>Раздел</span>
			</nav>
			<MobileSidebarTrigger />
			<Input
				placeholder='Поиск (пока не реализовано)'
				className='h-9 w-[220px] md:w-[280px] lg:w-[320px]'
			/>
		</div>

		<div className='flex items-center gap-2'>
			<Button
				variant='ghost'
				size='icon-sm'
				type='button'
				aria-label='Уведомления (заглушка)'
			>
				<Bell className='size-4' />
			</Button>

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
					<DropdownMenuItem variant='destructive'>Выйти</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
)

export { Header }
