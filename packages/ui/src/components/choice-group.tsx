'use client'

import type { ComponentProps, ReactNode } from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'

import { cn } from '../lib/utils'
import { Button } from './button'

export type ChoiceTone =
	| 'neutral'
	| 'primary'
	| 'danger'
	| 'success'
	| 'warning'
	| 'accent'

const tones: Record<ChoiceTone, string> = {
	neutral: '[--choice-color:var(--muted-foreground)]',
	primary: '[--choice-color:var(--primary)]',
	danger: '[--choice-color:var(--destructive)]',
	success: '[--choice-color:var(--choice-success)]',
	warning: '[--choice-color:var(--choice-warning)]',
	accent: '[--choice-color:var(--choice-accent)]',
}

export function ChoiceGroup({
	className,
	...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot='choice-group'
			loop
			className={cn('flex min-w-0 flex-wrap gap-2', className)}
			{...props}
		/>
	)
}

export function ChoiceGroupItem({
	className,
	tone = 'primary',
	icon,
	children,
	...props
}: Omit<ComponentProps<typeof RadioGroupPrimitive.Item>, 'asChild'> & {
	tone?: ChoiceTone
	icon?: ReactNode
}) {
	return (
		<RadioGroupPrimitive.Item {...props} asChild>
			<Button
				type='button'
				variant='outline'
				data-slot='choice-group-item'
				data-tone={tone}
				className={cn(
					'group/choice h-auto min-h-9 max-w-full justify-start whitespace-normal border-border bg-transparent px-2 py-1.5 text-left text-sm leading-5 font-normal text-foreground hover:bg-muted/50 hover:text-foreground data-[state=checked]:border-[var(--choice-color)] data-[state=checked]:bg-[color-mix(in_oklab,var(--choice-color)_12%,transparent)] data-[state=checked]:ring-1 data-[state=checked]:ring-[var(--choice-color)] data-[state=checked]:focus-visible:ring-[3px] dark:border-border dark:bg-transparent dark:hover:bg-muted/50 dark:data-[state=checked]:border-[var(--choice-color)] dark:data-[state=checked]:bg-[color-mix(in_oklab,var(--choice-color)_12%,transparent)]',
					tones[tone],
					className,
				)}
			>
				{icon && (
					<span
						aria-hidden='true'
						className='shrink-0 text-[var(--choice-color)] [&>svg]:size-4'
					>
						{icon}
					</span>
				)}
				<span className='min-w-0 wrap-anywhere'>{children}</span>
				<Check
					aria-hidden='true'
					className='size-3 shrink-0 text-[var(--choice-color)] opacity-0 group-data-[state=checked]/choice:opacity-100'
				/>
			</Button>
		</RadioGroupPrimitive.Item>
	)
}
