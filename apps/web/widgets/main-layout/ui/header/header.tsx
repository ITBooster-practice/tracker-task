'use client'

import React from 'react'

import { FEATURE_KEYS } from '@repo/types'
import { Button } from '@repo/ui'
import { Bell } from '@repo/ui/icons'

import { ThemeToggle } from '@/features/theme'
import { useFeature } from '@/shared/lib/feature-flags/context'

import { MobileSidebarTrigger } from './mobile-sidebar-trigger'
import { ProfileLink } from './profile-link'
import { SidebarToggle } from './sidebar-toggle'

const Header = () => {
	const notificationsEnabled = useFeature(FEATURE_KEYS.NOTIFICATIONS)
	return (
		<div className='flex h-14 items-center justify-between bg-sidebar px-3 text-sidebar-foreground'>
			<div className='flex min-w-0 items-center gap-2'>
				<div className='hidden md:block'>
					<SidebarToggle />
				</div>

				<MobileSidebarTrigger />
			</div>

			<div className='flex items-center gap-2'>
				{notificationsEnabled && (
					<Button
						variant='ghost'
						size='icon-sm'
						type='button'
						aria-label='Уведомления (заглушка)'
					>
						<Bell className='size-4' />
					</Button>
				)}
				<ThemeToggle size='icon-sm' iconClassName='size-4' />
				<ProfileLink />
			</div>
		</div>
	)
}

export { Header }
