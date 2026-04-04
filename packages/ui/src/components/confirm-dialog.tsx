'use client'

import * as React from 'react'

import { Button } from '@repo/ui/components/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog'
import { cn } from '@repo/ui/lib/utils'

type ButtonVariant = React.ComponentProps<typeof Button>['variant']

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: React.ReactNode
	description?: React.ReactNode
	children?: React.ReactNode
	confirmLabel?: string
	pendingLabel?: string
	cancelLabel?: string
	confirmVariant?: ButtonVariant
	isPending?: boolean
	confirmDisabled?: boolean
	showCloseButton?: boolean
	className?: string
	onConfirm: () => void | Promise<void>
}

function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	confirmLabel = 'Подтвердить',
	pendingLabel = 'Подождите...',
	cancelLabel = 'Отмена',
	confirmVariant = 'destructive',
	isPending = false,
	confirmDisabled = false,
	showCloseButton = false,
	className,
	onConfirm,
}: ConfirmDialogProps) {
	const handleOpenChange = (nextOpen: boolean) => {
		if (isPending && !nextOpen) {
			return
		}

		onOpenChange(nextOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={showCloseButton}
				className={cn(
					'gap-0 border-border bg-card p-0 shadow-[0_30px_80px_-34px_rgba(0,0,0,0.55)] sm:max-w-[420px]',
					className,
				)}
			>
				<DialogHeader className='p-4 pb-0 text-left'>
					<DialogTitle className='text-[18px] font-semibold tracking-tight'>
						{title}
					</DialogTitle>
					{description ? (
						<DialogDescription className='text-[14px] leading-6'>
							{description}
						</DialogDescription>
					) : null}
				</DialogHeader>

				{children ? <div className='px-4 pt-4'>{children}</div> : null}

				<DialogFooter className='p-4 pt-4 sm:justify-end'>
					<Button
						type='button'
						variant='outline'
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						{cancelLabel}
					</Button>
					<Button
						type='button'
						variant={confirmVariant}
						onClick={() => void onConfirm()}
						disabled={isPending || confirmDisabled}
					>
						{isPending ? pendingLabel : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
