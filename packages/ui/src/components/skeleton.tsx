import { cn } from '@repo/ui/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='skeleton'
			className={cn('animate-pulse rounded-[var(--radius-control)] bg-accent', className)}
			{...props}
		/>
	)
}

export { Skeleton }
