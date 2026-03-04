import React from 'react'

interface Props {
	sidebar: React.ReactNode
	header: React.ReactNode
	children: React.ReactNode
}

function Layout({ header, sidebar, children }: Props) {
	return (
		<div className='flex h-screen flex-col'>
			<header className='border-b border-b-sidebar-border bg-sidebar '>{header}</header>
			<div className='flex min-h-0 flex-1 overflow-hidden'>
				<aside className='shrink-0 border-r border-r-sidebar-border bg-sidebar text-sidebar-foreground'>
					{sidebar}
				</aside>
				<main className='flex flex-1 overflow-auto bg-slate-950'>{children}</main>
			</div>
		</div>
	)
}

export { Layout }
