'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import type { BoardListItem } from '@repo/types'
import { ConfirmDialog } from '@repo/ui'

import { boardsKeys, useDeleteBoard } from '@/shared/api/use-boards'
import { isApiError } from '@/shared/lib/api/utils'

interface DeleteBoardDialogProps {
	board: BoardListItem
	teamId: string
	projectId: string
	onOpenChange: (open: boolean) => void
}

export function DeleteBoardDialog({
	board,
	teamId,
	projectId,
	onOpenChange,
}: DeleteBoardDialogProps) {
	const remove = useDeleteBoard()
	const client = useQueryClient()
	const [error, setError] = useState<string | null>(null)
	const submitting = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const blocked = board.isDefault || board.taskCount > 0
	const handleConfirm = async () => {
		if (blocked || submitting.current) return
		submitting.current = true
		setError(null)
		try {
			await remove.mutateAsync({ teamId, projectId, boardId: board.id })
			if (mounted.current) onOpenChange(false)
		} catch (cause) {
			if (!mounted.current) return
			setError(
				isApiError(cause) && cause.statusCode === 403
					? 'Удалять доски могут владелец и администратор команды.'
					: isApiError(cause) && cause.statusCode === 409
						? 'Доска содержит задачи или стала основной. Обновите список и перенесите задачи перед удалением.'
						: isApiError(cause) && cause.statusCode === 404
							? 'Доска больше недоступна. Обновите список досок.'
							: 'Не удалось удалить доску. Повторите попытку.',
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
	return (
		<ConfirmDialog
			open
			title='Удалить доску?'
			description={
				board.isDefault
					? 'Основную доску проекта удалить нельзя.'
					: board.taskCount > 0
						? `На доске «${board.name}» есть задачи. Перед удалением перенесите их в другую доску.`
						: `Пустая доска «${board.name}» будет удалена. Это действие нельзя отменить.`
			}
			confirmLabel='Удалить'
			pendingLabel='Удаляем…'
			confirmDisabled={blocked}
			isPending={remove.isPending}
			onConfirm={handleConfirm}
			onOpenChange={(open) => {
				if (!submitting.current) onOpenChange(open)
			}}
		>
			{error && (
				<p role='alert' className='text-sm text-destructive'>
					{error}
				</p>
			)}
		</ConfirmDialog>
	)
}
