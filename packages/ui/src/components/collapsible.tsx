'use client'

import type { ComponentProps } from 'react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'

import { cn } from '../lib/utils'

export function Collapsible(props: ComponentProps<typeof CollapsiblePrimitive.Root>) {
	return <CollapsiblePrimitive.Root data-slot='collapsible' {...props} />
}

export function CollapsibleTrigger(
	props: ComponentProps<typeof CollapsiblePrimitive.Trigger>,
) {
	return <CollapsiblePrimitive.Trigger data-slot='collapsible-trigger' {...props} />
}

export function CollapsibleContent({
	className,
	orientation = 'vertical',
	...props
}: ComponentProps<typeof CollapsiblePrimitive.Content> & {
	orientation?: 'horizontal' | 'vertical'
}) {
	return (
		<CollapsiblePrimitive.Content
			data-slot='collapsible-content'
			className={cn(
				'min-w-0 overflow-hidden motion-reduce:animate-none!',
				orientation === 'horizontal'
					? 'data-[state=open]:animate-expand-width data-[state=closed]:animate-collapse-width'
					: 'data-[state=open]:animate-expand-height data-[state=closed]:animate-collapse-height',
				className,
			)}
			{...props}
		/>
	)
}
