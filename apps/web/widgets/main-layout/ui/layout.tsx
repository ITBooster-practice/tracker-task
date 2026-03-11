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
			<div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
				<header className='border-b border-b-sidebar-border bg-sidebar'>{header}</header>
				<main className='flex min-h-0 flex-1 flex-col overflow-auto bg-background'>
					{children}
				</main>
			</div>
		</div>
	)
}

export { Layout }
