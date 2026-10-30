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
	placeholder?: string
	disabled?: boolean
	loading?: boolean
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
	placeholder,
	disabled = false,
	loading = false,
	onSelect,
}: Props) {
	const isEmpty = options.length === 0
	const unavailableLabel = loading ? 'Загрузка…' : emptyLabel

	if (!isOpen) {
		const collapsedDisabled = isEmpty || disabled
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={collapsedDisabled}>
					<button
						title={
							collapsedDisabled
								? disabled
									? placeholder
									: unavailableLabel
								: `${label}: ${value}`
						}
						disabled={collapsedDisabled}
						aria-label={`${label}: ${value || (disabled ? placeholder : unavailableLabel)}`}
						aria-busy={loading}
						className='flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] bg-sidebar-accent text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:cursor-not-allowed disabled:opacity-50'
					>
						{shortValue}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side='right' align='start' className='min-w-[180px]'>
					<DropdownMenuLabel className='text-xs uppercase tracking-wide text-muted-foreground'>
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

	if (isEmpty || disabled) {
		return (
			<div
				aria-busy={loading}
				className='h-14 w-full rounded-[var(--radius-control)] border border-sidebar-border px-3 py-2'
			>
				<div className='text-xs font-medium text-muted-foreground'>{label}</div>
				<div className='truncate pt-0.5 text-sm text-muted-foreground'>
					{disabled ? (placeholder ?? '—') : value || unavailableLabel}
				</div>
			</div>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					aria-label={`${label}: ${value || placeholder}`}
					className='h-14 w-full cursor-pointer rounded-[var(--radius-control)] border border-sidebar-border px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:border-sidebar-primary/40 data-[state=open]:bg-sidebar-accent/20'
				>
					<div className='text-xs font-medium text-muted-foreground'>{label}</div>
					<div className='flex items-center justify-between gap-2 pt-0.5'>
						{value ? (
							<span className='truncate text-sm font-medium'>{value}</span>
						) : (
							<span className='truncate text-sm text-sidebar-foreground/40'>
								{placeholder ?? '—'}
							</span>
						)}
						<ChevronDown className='size-4 shrink-0 text-muted-foreground' />
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
