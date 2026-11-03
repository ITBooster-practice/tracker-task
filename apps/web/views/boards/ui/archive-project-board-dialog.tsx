'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'

import type { BoardListItem } from '@repo/types'
import {
	Dialog,
	DialogContent,
	Sheet,
	SheetContent,
	toast,
	useMediaQuery,
	useOverlayClose,
} from '@repo/ui'

import { boardsKeys, useArchiveBoard } from '@/shared/api/use-boards'
import { isApiError } from '@/shared/lib/api/utils'

import { ArchiveBoardDialog } from './archive-board-dialog'

interface ArchiveProjectBoardDialogProps {
	board: BoardListItem
	teamId: string
	projectId: string
	onClose: () => void
	onReturnFocus: () => void
}

export function ArchiveProjectBoardDialog({
	board,
	teamId,
	projectId,
	onClose,
	onReturnFocus,
}: ArchiveProjectBoardDialogProps) {
	const id = useId()
	const client = useQueryClient()
	const desktop = useMediaQuery('(min-width: 1280px)')
	const [error, setError] = useState<string | null>(null)
	const [opener] = useState(() =>
		typeof document === 'undefined'
			? null
			: (document.activeElement as HTMLElement | null),
	)
	const submitting = useRef(false)
	const mounted = useRef(true)
	const archived = useRef(false)
	const { open, close, completeClose } = useOverlayClose(() => {
		if (archived.current) {
			toast.success('Доска архивирована')
		}
		onClose()
	})
	const archive = useArchiveBoard({
		onArchived: async () => {
			archived.current = true
			await close()
		},
	})
	const pending = archive.isPending || !open
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const cancel = () => {
		if (!submitting.current) void close()
	}
	const confirm = async () => {
		if (submitting.current || !open) return
		submitting.current = true
		setError(null)
		try {
			await archive.mutateAsync({
				teamId,
				projectId,
				boardId: board.id,
				data: { expectedUpdatedAt: board.updatedAt },
			})
		} catch (cause) {
			if (mounted.current)
				setError(
					isApiError(cause) && cause.statusCode === 403
						? 'Архивировать доску могут владелец и администратор команды.'
						: isApiError(cause) && cause.statusCode === 404
							? 'Доска недоступна. Возможно, она уже архивирована или удалена.'
							: isApiError(cause) && cause.statusCode === 409
								? 'Доска изменилась. Закройте подтверждение и откройте его заново, чтобы загрузить актуальные данные.'
								: 'Не удалось архивировать доску. Данные не изменены. Повторите попытку.',
				)
			if (isApiError(cause) && (cause.statusCode === 409 || cause.statusCode === 404))
				void client.invalidateQueries({
					queryKey: boardsKeys.list(teamId, projectId),
					exact: true,
				})
		} finally {
			submitting.current = false
		}
	}
	const Root = desktop ? Dialog : Sheet
	const Content = desktop ? DialogContent : SheetContent
	return (
		<Root
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) cancel()
			}}
		>
			<Content
				{...(!desktop ? { side: 'right' as const } : {})}
				showCloseButton={false}
				onOpenAutoFocus={(event) => {
					event.preventDefault()
					document.getElementById(id)?.focus()
				}}
				className={
					desktop
						? 'flex max-h-[calc(100dvh-3rem)] flex-col gap-0 overflow-hidden bg-popover p-0 sm:max-w-[600px]'
						: 'flex h-dvh w-full flex-col gap-0 overflow-hidden bg-popover p-0 sm:max-w-[640px]'
				}
				onCloseAutoFocus={(event) => {
					event.preventDefault()
					if (!archived.current && opener?.isConnected)
						opener.focus({ preventScroll: true })
					else onReturnFocus()
					completeClose()
				}}
			>
				<ArchiveBoardDialog
					boardName={board.name}
					columnCount={board.columns.length}
					taskCount={board.taskCount}
					desktop={desktop}
					pending={pending}
					error={error}
					cancelId={id}
					onCancel={cancel}
					onConfirm={() => void confirm()}
				/>
			</Content>
		</Root>
	)
}
