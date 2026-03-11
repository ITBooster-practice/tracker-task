import React from 'react'

import { Button, Input } from '@repo/ui'
import { Bell } from '@repo/ui/icons'

import { MobileSidebarTrigger } from './mobile-sidebar-trigger'
import { ProfileMenu } from './profile-menu'
import { SidebarToggle } from './sidebar-toggle'

const Header = () => (
	<div className='flex h-14 items-center justify-between bg-sidebar px-3 text-sidebar-foreground'>
		<div className='flex min-w-0 items-center gap-2'>
			<div className='hidden md:block'>
				<SidebarToggle />
			</div>

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
			<ProfileMenu />
		</div>
	</div>
)

export { Header }
