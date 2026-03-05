import * as React from 'react'

import { cn } from '@repo/ui/lib/utils'

import { Button } from '../button'

type EmptyStateProps = React.ComponentProps<'section'> & {
	icon?: React.ReactNode
	title: string
	description?: string
	actionLabel?: string
	onAction?: () => void
}

function EmptyState({
	className,
	icon,
	title,
	description,
	actionLabel,
	onAction,
	...props
}: EmptyStateProps) {
	return (
		<section
			data-slot='empty-state'
			className={cn(
				'flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center',
				className,
			)}
			{...props}
		>
			<div className='bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold'>
				{icon ?? '!'}
			</div>

			<div className='space-y-1.5'>
				<h1 className='text-2xl font-semibold'>{title}</h1>
				{description ? (
					<p className='text-muted-foreground text-sm'>{description}</p>
				) : null}
			</div>

			{actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
		</section>
	)
}

export { EmptyState }
export type { EmptyStateProps }
