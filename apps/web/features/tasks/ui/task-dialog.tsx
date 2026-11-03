'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'

import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	useMediaQuery,
} from '@repo/ui'
import { X } from '@repo/ui/icons'

const subscribe = () => () => undefined
const clientReady = () => true
const serverReady = () => false

interface TaskDialogProps {
	title: string
	description: string
	children: ReactNode
	headerMeta?: ReactNode
	footer?: ReactNode
	variant?: 'form' | 'details'
	pending?: boolean
	open?: boolean
	onClose: () => void
	onClosed?: () => void
	returnFocus?: HTMLElement | null
}

export function TaskDialog({
	title,
	description,
	children,
	headerMeta,
	footer,
	variant = 'details',
	pending = false,
	open = true,
	onClose,
	onClosed,
	returnFocus,
}: TaskDialogProps) {
	const desktop = useMediaQuery('(min-width: 1280px)')
	const ready = useSyncExternalStore(subscribe, clientReady, serverReady)
	const [opener] = useState(() =>
		typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
			? document.activeElement
			: null,
	)
	if (!ready) return null
	const Root = desktop ? Dialog : Sheet
	const Content = desktop ? DialogContent : SheetContent
	const Header = desktop ? DialogHeader : SheetHeader
	const Title = desktop ? DialogTitle : SheetTitle
	const Description = desktop ? DialogDescription : SheetDescription
	return (
		<Root
			open={open}
			onOpenChange={(open) => {
				if (!open && !pending) onClose()
			}}
		>
			<Content
				{...(!desktop ? { side: 'right' as const } : {})}
				showCloseButton={variant === 'form'}
				className={cn(
					'grid grid-cols-1 gap-0 overflow-hidden bg-popover p-0',
					variant === 'form'
						? 'grid-rows-[auto_minmax(0,1fr)]'
						: 'grid-rows-[auto_minmax(0,1fr)_auto]',
					desktop ? 'max-h-[calc(100dvh-2rem)]' : 'h-dvh w-full sm:max-w-[640px]',
					desktop && (variant === 'form' ? 'sm:max-w-[800px]' : 'sm:max-w-[1040px]'),
				)}
				onCloseAutoFocus={(event) => {
					event.preventDefault()
					const target = returnFocus ?? opener
					if (target?.isConnected) target.focus()
					onClosed?.()
				}}
			>
				<Header
					className={
						variant === 'form'
							? 'px-6 pt-7 pb-5 text-left sm:px-8'
							: 'min-w-0 gap-3 border-b border-border px-6 py-6 text-left sm:px-7'
					}
				>
					{variant === 'details' && (
						<div className='flex min-w-0 items-center justify-between gap-3'>
							<div className='flex min-w-0 flex-wrap items-center gap-2.5'>
								{headerMeta}
							</div>
							<Button
								type='button'
								variant='ghost'
								size='icon-lg'
								className='shrink-0'
								disabled={pending}
								aria-label='Закрыть просмотр задачи'
								onClick={onClose}
							>
								<X aria-hidden className='size-5' />
							</Button>
						</div>
					)}
					<Title
						className={cn(
							'break-words',
							variant === 'form' ? 'pr-6 text-2xl leading-8' : 'text-[28px] leading-9',
						)}
					>
						{title}
					</Title>
					<Description
						className={
							variant === 'form'
								? 'text-sm leading-5 font-normal'
								: 'text-xs leading-4 font-normal'
						}
					>
						{description}
					</Description>
				</Header>
				{children}
				{footer}
			</Content>
		</Root>
	)
}
