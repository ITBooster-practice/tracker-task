'use client'

import { useEffect, useId, useState } from 'react'

import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
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
	disabledReason?: string
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
	disabledReason,
	loading = false,
	onSelect,
}: Props) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [hintOpen, setHintOpen] = useState(false)
	const descriptionId = useId()
	const isEmpty = options.length === 0
	const unavailableLabel = loading ? 'Загрузка…' : emptyLabel
	useEffect(() => {
		setMenuOpen(false)
		setHintOpen(false)
	}, [isOpen, disabled, isEmpty])

	if (!isOpen) {
		const collapsedDisabled = isEmpty || disabled
		const selectionHint = disabled
			? (disabledReason ?? placeholder ?? unavailableLabel)
			: isEmpty
				? [value, unavailableLabel].filter(Boolean).join('. ')
				: value || placeholder || label
		const hint = `${label}: ${selectionHint}`
		const button = (
			<Button
				type='button'
				variant='ghost'
				size='icon'
				aria-disabled={collapsedDisabled || undefined}
				aria-describedby={collapsedDisabled ? descriptionId : undefined}
				aria-label={`${label}: ${value || placeholder || unavailableLabel}`}
				aria-busy={loading}
				className='bg-sidebar-accent text-xs font-semibold text-sidebar-foreground hover:bg-sidebar-accent/70 dark:hover:bg-sidebar-accent/70 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
				onClick={
					collapsedDisabled
						? (event) => {
								event.preventDefault()
								setHintOpen(true)
							}
						: undefined
				}
			>
				{shortValue}
			</Button>
		)
		const tooltip = (
			<TooltipProvider>
				<Tooltip open={hintOpen && !menuOpen} onOpenChange={setHintOpen}>
					<TooltipTrigger asChild>
						{collapsedDisabled ? (
							button
						) : (
							<DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
						)}
					</TooltipTrigger>
					{collapsedDisabled && (
						<span id={descriptionId} className='sr-only'>
							{hint}
						</span>
					)}
					<TooltipContent side='right' sideOffset={8}>
						{hint}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
		if (collapsedDisabled) return tooltip
		return (
			<DropdownMenu
				key='collapsed'
				modal={false}
				open={menuOpen}
				onOpenChange={(open) => {
					setMenuOpen(open)
					if (open) setHintOpen(false)
				}}
			>
				{tooltip}
				<DropdownMenuContent
					side='right'
					sideOffset={8}
					align='start'
					className='min-w-[180px]'
				>
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
		<DropdownMenu key='expanded' modal={false}>
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
