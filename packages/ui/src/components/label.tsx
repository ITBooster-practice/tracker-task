'use client'

import * as React from 'react'
import { Label as LabelPrimitive } from 'radix-ui'

import { cn } from '@repo/ui/lib/utils'

function Label({
	className,
	children,
	required = false,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
	return (
		<LabelPrimitive.Root
			data-slot='label'
			className={cn(
				'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className,
			)}
			{...props}
		>
			{required ? (
				<span>
					{children}
					<span aria-hidden className='text-destructive'>
						*
					</span>
				</span>
			) : (
				children
			)}
		</LabelPrimitive.Root>
	)
}

export { Label }
