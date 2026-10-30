import type { ReactNode } from 'react'

import { cn } from '@repo/ui'

import {
	pageDescriptionClassName,
	pageHeaderRowClassName,
	pageTitleClassName,
} from './styles'

interface PageHeaderProps {
	title: ReactNode
	description: ReactNode
	navigation?: ReactNode
	actions?: ReactNode
	className?: string
}

export function PageHeader({
	title,
	description,
	navigation,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<header className={cn('flex flex-col gap-3', className)}>
			{navigation}
			<div className={pageHeaderRowClassName}>
				<div className='min-w-0 flex-auto'>
					<h1 className={cn(pageTitleClassName, 'break-words')}>{title}</h1>
					<p className={pageDescriptionClassName}>{description}</p>
				</div>
				{actions && (
					<div className='flex max-w-full shrink-0 flex-wrap items-center gap-2'>
						{actions}
					</div>
				)}
			</div>
		</header>
	)
}
