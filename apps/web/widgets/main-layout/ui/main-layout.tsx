'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { getSidebarRouteId, SIDEBAR_ROUTE_IDS } from '@/shared/config'

import { SidebarStateProvider } from '../model/sidebar/provider'
import { Header } from './header'
import { Layout } from './layout'
import { Sidebar } from './sidebar'

interface Props {
	children: React.ReactNode
	initialSidebarOpen?: boolean
}

const MainLayout = (props: Props) => {
	const { children, initialSidebarOpen = true } = props
	const wideNavigation =
		getSidebarRouteId(usePathname() ?? '') === SIDEBAR_ROUTE_IDS.boards

	return (
		<SidebarStateProvider initialOpen={initialSidebarOpen}>
			<Layout
				wideNavigation={wideNavigation}
				sidebar={<Sidebar />}
				header={<Header wideNavigation={wideNavigation} />}
			>
				{children}
			</Layout>
		</SidebarStateProvider>
	)
}

export { MainLayout }
