import React from 'react'

import { Header } from './header'
import { Layout } from './layout'
import { Sidebar } from './sidebar'

interface Props {
	children: React.ReactNode
}

const MainLayout = (props: Props) => {
	const { children } = props

	return (
		<Layout sidebar={<Sidebar />} header={<Header />}>
			{children}
		</Layout>
	)
}

export { MainLayout }
