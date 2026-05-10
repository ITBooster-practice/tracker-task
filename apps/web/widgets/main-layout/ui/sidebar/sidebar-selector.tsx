'use client'

import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@repo/ui'
import { ChevronDown } from '@repo/ui/icons'

export interface SelectorOption {
	id: string
	name: string
	shortName: string
}

interface Props {
	label: string
	value: string
	shortValue: string
	options: SelectorOption[]
	activeId: string | null
	isOpen: boolean
	emptyLabel?: string
	onSelect: (id: string) => void
}

function SidebarSelector({
	label,
	value,
	shortValue,
	options,
	activeId,
	isOpen,
	emptyLabel = 'Нет элементов',
	onSelect,
}: Props) {
	const isEmpty = options.length === 0

	if (!isOpen) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={isEmpty}>
					<button
						title={isEmpty ? emptyLabel : `${label}: ${value}`}
						disabled={isEmpty}
						className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-control)] bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40'
					>
						{shortValue}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side='right' align='start' className='min-w-[180px]'>
					<DropdownMenuLabel className='text-[11px] uppercase tracking-wide text-muted-foreground'>
						{label}
					</DropdownMenuLabel>
					{options.map((option) => (
						<DropdownMenuItem
							key={option.id}
							className={cn(
								'cursor-pointer',
								option.id === activeId && 'font-medium text-sidebar-primary',
							)}
							onSelect={() => onSelect(option.id)}
						>
							{option.name}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}

	if (isEmpty) {
		return (
			<div className='w-full rounded-[var(--radius-control)] border border-sidebar-border/50 px-3 py-2 opacity-50'>
				<div className='text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50'>
					{label}
				</div>
				<div className='pt-0.5 text-sm text-sidebar-foreground/40'>{emptyLabel}</div>
			</div>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='w-full cursor-pointer rounded-[var(--radius-control)] border border-sidebar-border px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/20 focus-visible:outline-none data-[state=open]:border-sidebar-primary/40 data-[state=open]:bg-sidebar-accent/20'>
					<div className='text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50'>
						{label}
					</div>
					<div className='flex items-center justify-between gap-2 pt-0.5'>
						<span className='truncate text-sm font-medium'>{value || '—'}</span>
						<ChevronDown className='size-3.5 shrink-0 text-sidebar-foreground/50' />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='start'
				sideOffset={4}
				className='w-[--radix-dropdown-menu-trigger-width]'
			>
				{options.map((option) => (
					<DropdownMenuItem
						key={option.id}
						className={cn(
							'cursor-pointer justify-between gap-3',
							option.id === activeId && 'font-medium text-sidebar-primary',
						)}
						onSelect={() => onSelect(option.id)}
					>
						<span className='truncate'>{option.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export { SidebarSelector }
