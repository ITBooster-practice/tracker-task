'use client'

import React from 'react'

import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@repo/ui'
import { SidebarOpen } from '@repo/ui/icons'

import { Sidebar } from '../sidebar'

const MobileSidebarTrigger = () => {
	const [isOpen, setIsOpen] = React.useState(false)

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					size='icon-sm'
					variant='ghost'
					type='button'
					className='md:hidden'
					aria-label='Открыть sidebar'
					aria-expanded={isOpen}
				>
					<SidebarOpen />
				</Button>
			</SheetTrigger>

			<SheetContent
				side='left'
				className='w-[260px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground'
				showCloseButton={false}
			>
				<SheetHeader className='sr-only'>
					<SheetTitle>Навигация</SheetTitle>
				</SheetHeader>
				<Sidebar forceOpen className='w-full' onNavigate={() => setIsOpen(false)} />
			</SheetContent>
		</Sheet>
	)
}

export { MobileSidebarTrigger }
