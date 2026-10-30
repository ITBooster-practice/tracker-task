'use client'

import Link from 'next/link'
import { useId, useState } from 'react'

import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui'

import type { SidebarNavItem } from '../../model/sidebar'

interface Props extends SidebarNavItem {
	isOpen: boolean
	isActive?: boolean
	onNavigate?: () => void
}

const SidebarMenuItem = ({
	href,
	title,
	icon: Icon,
	iconClassName,
	disabledReason,
	isOpen,
	isActive = false,
	onNavigate,
}: Props) => {
	const [hintOpen, setHintOpen] = useState(false)
	const descriptionId = useId()
	const disabled = !href || Boolean(disabledReason)
	const reason = disabledReason ?? 'Раздел пока недоступен'
	const className = cn(
		'flex h-11 w-full items-center rounded-[var(--radius-control)] text-sm leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
		{
			'justify-center': !isOpen,
			'justify-start gap-3 px-3': isOpen,
			'bg-sidebar-accent/80 font-medium text-sidebar-primary': isActive && !disabled,
			'text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground':
				!isActive && !disabled,
			'cursor-not-allowed text-muted-foreground': disabled,
		},
	)
	const content = (
		<>
			<Icon
				aria-hidden='true'
				className={cn('size-4 shrink-0', !disabled && iconClassName)}
			/>
			{isOpen && <span className='truncate'>{title}</span>}
		</>
	)
	if (disabled)
		return (
			<TooltipProvider>
				<Tooltip open={hintOpen} onOpenChange={setHintOpen}>
					<TooltipTrigger asChild>
						<button
							type='button'
							aria-label={title}
							aria-disabled='true'
							aria-describedby={descriptionId}
							className={className}
							onClick={(event) => {
								event.preventDefault()
								setHintOpen(true)
							}}
						>
							{content}
						</button>
					</TooltipTrigger>
					<span id={descriptionId} className='sr-only'>
						{reason}
					</span>
					<TooltipContent side='right' sideOffset={8}>
						{reason}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	return (
		<Link
			href={href!}
			aria-label={title}
			aria-current={isActive ? 'page' : undefined}
			title={!isOpen ? title : undefined}
			onClick={onNavigate}
			className={className}
		>
			{content}
		</Link>
	)
}

export { SidebarMenuItem }
