'use client'

import type { ReactNode } from 'react'

import { cn } from '@repo/ui/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge, type BadgeTone } from './badge'

export interface UserSummaryProps {
	name: string
	initials: string
	avatarSrc?: string | null
	roleLabel: string
	roleDescription?: string
	roleTone?: BadgeTone
	neutral?: boolean
	pending?: boolean
	collapsed?: boolean
	className?: string
	renderProfileLink?: (children: ReactNode, className: string) => ReactNode
}

function UserSummary({
	name,
	initials,
	avatarSrc,
	roleLabel,
	roleDescription,
	roleTone = 'member',
	neutral = false,
	pending = false,
	collapsed = false,
	className,
	renderProfileLink,
}: UserSummaryProps) {
	const avatar = (
		<Avatar aria-hidden='true'>
			{avatarSrc && <AvatarImage src={avatarSrc} alt='' className='object-cover' />}
			<AvatarFallback>{initials}</AvatarFallback>
		</Avatar>
	)
	const nameClassName =
		'w-full truncate ps-[calc(var(--badge-padding-x)+1px)] text-sm font-medium leading-5'
	const linkClassName =
		'rounded-[var(--radius-control)] outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]'
	return (
		<div
			data-slot='user-summary'
			aria-busy={pending}
			title={collapsed ? `${name} — ${roleDescription ?? roleLabel}` : undefined}
			className={cn(
				'flex min-w-0 items-center gap-2',
				collapsed && 'justify-center',
				className,
			)}
		>
			{renderProfileLink
				? renderProfileLink(avatar, cn('shrink-0', linkClassName))
				: avatar}
			<div
				className={
					collapsed ? 'sr-only' : 'flex min-w-0 flex-1 flex-col items-start gap-1'
				}
			>
				{renderProfileLink && !collapsed ? (
					renderProfileLink(name, cn(nameClassName, linkClassName))
				) : (
					<div className={nameClassName} title={name}>
						{name}
					</div>
				)}
				<Badge
					variant='outline'
					tone={neutral ? undefined : roleTone}
					title={roleDescription ?? roleLabel}
					className={cn('max-w-full', neutral && 'text-muted-foreground')}
				>
					<span className='truncate'>{roleLabel}</span>
				</Badge>
			</div>
		</div>
	)
}

export { UserSummary }
