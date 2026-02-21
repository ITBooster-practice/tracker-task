import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@repo/ui/lib/utils'

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
	variants: {
		size: {
			sm: 'max-w-screen-sm',
			md: 'max-w-screen-md',
			lg: 'max-w-screen-lg',
			xl: 'max-w-screen-xl',
			'2xl': 'max-w-screen-2xl',
			full: 'max-w-full',
		},
		centered: {
			true: 'flex flex-col items-center',
			false: '',
		},
	},
	defaultVariants: {
		size: 'xl',
		centered: false,
	},
})

function Container({
	className,
	size = 'xl',
	centered = false,
	asChild = false,
	...props
}: React.ComponentProps<'div'> &
	VariantProps<typeof containerVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot.Root : 'div'

	return (
		<Comp
			data-slot='container'
			data-size={size}
			className={cn(containerVariants({ size, centered, className }))}
			{...props}
		/>
	)
}

export { Container, containerVariants }
