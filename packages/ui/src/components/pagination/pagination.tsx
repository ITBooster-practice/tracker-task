import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'
import { buttonVariants, type Button } from '@repo/ui/components/button'

// ─── Shadcn primitives ────────────────────────────────────────────────────────

function PaginationRoot({ className, ...props }: React.ComponentProps<'nav'>) {
	return (
		<nav
			role='navigation'
			aria-label='pagination'
			data-slot='pagination'
			className={cn('mx-auto flex w-full justify-center', className)}
			{...props}
		/>
	)
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot='pagination-content'
			className={cn('flex flex-row items-center gap-1', className)}
			{...props}
		/>
	)
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
	return <li data-slot='pagination-item' {...props} />
}

type PaginationLinkProps = {
	isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
	React.ComponentProps<'a'>

function PaginationLink({
	className,
	isActive,
	size = 'icon',
	...props
}: PaginationLinkProps) {
	return (
		<a
			aria-current={isActive ? 'page' : undefined}
			data-slot='pagination-link'
			data-active={isActive}
			className={cn(
				buttonVariants({
					variant: isActive ? 'outline' : 'ghost',
					size,
				}),
				className,
			)}
			{...props}
		/>
	)
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label='Предыдущая страница'
			size='default'
			className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
			{...props}
		>
			<ChevronLeftIcon />
			<span className='hidden sm:block'>Назад</span>
		</PaginationLink>
	)
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label='Следующая страница'
			size='default'
			className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
			{...props}
		>
			<span className='hidden sm:block'>Вперёд</span>
			<ChevronRightIcon />
		</PaginationLink>
	)
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			aria-hidden
			data-slot='pagination-ellipsis'
			className={cn('flex size-9 items-center justify-center', className)}
			{...props}
		>
			<MoreHorizontalIcon className='size-4' />
			<span className='sr-only'>Ещё страницы</span>
		</span>
	)
}

// ─── Smart wrapper ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

export interface PaginationProps {
	meta: PaginationMeta
	onPageChange: (page: number) => void
	className?: string
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1)
	}

	const pages: (number | 'ellipsis')[] = [1]

	const left = Math.max(2, current - 1)
	const right = Math.min(total - 1, current + 1)

	if (left > 2) pages.push('ellipsis')
	for (let i = left; i <= right; i++) pages.push(i)
	if (right < total - 1) pages.push('ellipsis')

	pages.push(total)

	return pages
}

function Pagination({ meta, onPageChange, className }: PaginationProps) {
	const { page, totalPages } = meta
	const pages = getPageNumbers(page, totalPages)

	return (
		<PaginationRoot className={className}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={(e) => {
							e.preventDefault()
							onPageChange(page - 1)
						}}
						aria-disabled={page <= 1}
						className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
					/>
				</PaginationItem>

				{pages.map((item, index) =>
					item === 'ellipsis' ? (
						<PaginationItem key={`ellipsis-${index}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<PaginationLink
								isActive={item === page}
								onClick={(e) => {
									e.preventDefault()
									onPageChange(item)
								}}
								aria-label={`Страница ${item}`}
							>
								{item}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					<PaginationNext
						onClick={(e) => {
							e.preventDefault()
							onPageChange(page + 1)
						}}
						aria-disabled={page >= totalPages}
						className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
					/>
				</PaginationItem>
			</PaginationContent>
		</PaginationRoot>
	)
}

export {
	PaginationRoot,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
	Pagination,
}
