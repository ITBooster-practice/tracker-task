import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { badgeToneVariants, type BadgeTone } from '@repo/ui/lib/badge-tones'
import { cn } from '@repo/ui/lib/utils'

const badgeVariants = cva(
	'inline-flex h-[var(--badge-height)] items-center justify-center rounded-full border border-transparent px-[var(--badge-padding-x)] py-0 text-xs leading-4 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
				secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
				destructive:
					'bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
				ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 [a&]:hover:underline',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

function Badge({
	className,
	variant = 'default',
	tone,
	asChild = false,
	...props
}: React.ComponentProps<'span'> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean; tone?: BadgeTone }) {
	const Comp = asChild ? Slot.Root : 'span'

	return (
		<Comp
			data-slot='badge'
			data-variant={variant}
			data-tone={tone}
			className={cn(badgeVariants({ variant }), badgeToneVariants({ tone }), className)}
			{...props}
		/>
	)
}

export { Badge, badgeVariants, badgeToneVariants, type BadgeTone }
