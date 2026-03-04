'use client'

import React from 'react'

import { Button } from '@repo/ui'
import { SidebarClose, SidebarOpen } from '@repo/ui/icons'

import { useSideBarStore } from '../../model/sidebar'

const SidebarToggle = () => {
	const { toggle, isOpen } = useSideBarStore()

	return (
		<Button
			size='icon-sm'
			variant='ghost'
			type='button'
			aria-label='Toggle sidebar'
			aria-expanded={isOpen}
			onClick={toggle}
		>
			{isOpen ? <SidebarClose /> : <SidebarOpen />}
		</Button>
	)
}

export { SidebarToggle }
