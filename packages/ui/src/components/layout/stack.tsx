import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@repo/ui/lib/utils'

const stackVariants = cva('flex', {
	variants: {
		direction: {
			horizontal: 'flex-row',
			vertical: 'flex-col',
		},
		spacing: {
			none: 'gap-0',
			xs: 'gap-1',
			sm: 'gap-2',
			md: 'gap-4',
			lg: 'gap-6',
			xl: 'gap-8',
			'2xl': 'gap-12',
		},
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			stretch: 'items-stretch',
			baseline: 'items-baseline',
		},
		justify: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end',
			between: 'justify-between',
			around: 'justify-around',
			evenly: 'justify-evenly',
		},
		wrap: {
			true: 'flex-wrap',
			false: 'flex-nowrap',
		},
	},
	defaultVariants: {
		direction: 'vertical',
		spacing: 'md',
		align: 'stretch',
		justify: 'start',
		wrap: false,
	},
})

type StackProps = React.ComponentProps<'div'> &
	VariantProps<typeof stackVariants> & {
		asChild?: boolean
	}

function Stack({
	className,
	direction = 'vertical',
	spacing = 'md',
	align = 'stretch',
	justify = 'start',
	wrap = false,
	asChild = false,
	...props
}: StackProps) {
	const Comp = asChild ? Slot.Root : 'div'

	return (
		<Comp
			data-slot='stack'
			data-direction={direction}
			className={cn(
				stackVariants({ direction, spacing, align, justify, wrap, className }),
			)}
			{...props}
		/>
	)
}

function HStack({
	direction = 'horizontal',
	...props
}: Omit<StackProps, 'direction'> & { direction?: 'horizontal' }) {
	return <Stack direction={direction} {...props} />
}

function VStack({
	direction = 'vertical',
	...props
}: Omit<StackProps, 'direction'> & { direction?: 'vertical' }) {
	return <Stack direction={direction} {...props} />
}

export { Stack, HStack, VStack, stackVariants }
