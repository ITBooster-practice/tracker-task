import { Badge, cn } from '@repo/ui'

export function TaskLabels({
	labels,
	className,
}: {
	labels: readonly string[]
	className?: string
}) {
	if (!labels.length) return null
	return (
		<ul
			aria-label='Метки задачи'
			className={cn('flex min-w-0 flex-wrap gap-2', className)}
		>
			{labels.map((label) => (
				<li key={label} className='min-w-0 max-w-full'>
					<Badge
						variant='secondary'
						className='max-w-full bg-muted text-xs font-normal whitespace-normal text-muted-foreground wrap-anywhere'
					>
						{label}
					</Badge>
				</li>
			))}
		</ul>
	)
}
