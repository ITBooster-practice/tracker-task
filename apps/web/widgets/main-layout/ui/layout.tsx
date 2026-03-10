import React from 'react'

interface Props {
	sidebar: React.ReactNode
	header: React.ReactNode
	children: React.ReactNode
}

function Layout({ header, sidebar, children }: Props) {
	return (
		<div className='flex h-screen overflow-hidden bg-background'>
			<aside className='hidden shrink-0 border-r border-r-sidebar-border bg-sidebar text-sidebar-foreground md:block'>
				{sidebar}
			</aside>
			<div className='flex flex-col min-h-0 flex-1 overflow-hidden'>
				<header className='border-b border-b-sidebar-border bg-sidebar '>{header}</header>
				<main className='flex-1 overflow-auto bg-background'>{children}</main>
			</div>
		</div>
	)
}

export { Layout }
