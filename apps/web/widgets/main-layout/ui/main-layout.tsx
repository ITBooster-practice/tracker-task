import React from 'react'

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

	return (
		<SidebarStateProvider initialOpen={initialSidebarOpen}>
			<Layout sidebar={<Sidebar />} header={<Header />}>
				{children}
			</Layout>
		</SidebarStateProvider>
	)
}

export { MainLayout }
