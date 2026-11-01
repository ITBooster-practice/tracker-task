'use client'

import type { BoardListItem } from '@repo/types'

import { BoardEditorDialog } from './board-editor-dialog'

interface CreateBoardDialogProps {
	open: boolean
	teamId: string
	projectId: string
	projectName?: string
	onOpenChange: (open: boolean) => void
	onCreated: (board: BoardListItem) => void
}

export function CreateBoardDialog({
	open,
	teamId,
	projectId,
	projectName,
	onOpenChange,
	onCreated,
}: CreateBoardDialogProps) {
	return open ? (
		<BoardEditorDialog
			teamId={teamId}
			projectId={projectId}
			projectName={projectName}
			onClose={() => onOpenChange(false)}
			onSaved={onCreated}
		/>
	) : null
}
