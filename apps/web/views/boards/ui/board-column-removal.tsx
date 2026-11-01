import { Button, ChoiceGroup, ChoiceGroupItem } from '@repo/ui'
import { Trash2, Undo2 } from '@repo/ui/icons'

import type { ColumnDraft } from '../model/board-editor'
import { formatBoardTaskCount } from '../model/task-count'

interface ColumnRemovalConfirmationProps {
	column: ColumnDraft
	taskCount: number
	targets: readonly ColumnDraft[]
	targetKey: string
	onTargetChange: (key: string) => void
	onCancel: () => void
	onConfirm: () => void
	disabled: boolean
}

export function ColumnRemovalConfirmation({
	column,
	taskCount,
	targets,
	targetKey,
	onTargetChange,
	onCancel,
	onConfirm,
	disabled,
}: ColumnRemovalConfirmationProps) {
	return (
		<div
			className='space-y-3 border-t border-destructive/30 bg-destructive/5 p-4'
			role='group'
			aria-label='Подтверждение удаления колонки'
		>
			<p className='text-base font-semibold'>
				Удалить колонку «{column.title || 'Новая колонка'}»?
			</p>
			<p className='text-sm text-muted-foreground'>
				В колонке {formatBoardTaskCount(taskCount)}. Все задачи будут перенесены, включая
				скрытые фильтрами. Сами задачи не удаляются.
			</p>
			<p className='text-sm font-medium'>Перенести задачи в:</p>
			<ChoiceGroup
				aria-label='Колонка для переноса задач'
				value={targetKey}
				onValueChange={onTargetChange}
				disabled={disabled}
			>
				{targets.map((target) => (
					<ChoiceGroupItem key={target.key} value={target.key}>
						{target.title || 'Новая колонка'}
					</ChoiceGroupItem>
				))}
			</ChoiceGroup>
			<div className='flex flex-wrap justify-end gap-3'>
				<Button type='button' variant='outline' onClick={onCancel} disabled={disabled}>
					Отменить удаление
				</Button>
				<Button
					type='button'
					variant='destructive'
					disabled={disabled || !targets.some((target) => target.key === targetKey)}
					onClick={onConfirm}
				>
					Удалить при сохранении
				</Button>
			</div>
			<p className='text-xs text-muted-foreground'>
				Выберите, куда перенести задачи, и нажмите «Удалить при сохранении». Колонка и
				перенос задач изменятся только после «Сохранить изменения».
			</p>
		</div>
	)
}

export function ColumnRemovalSummary({
	column,
	taskCount,
	destination,
	destinationTaskCount,
	onUndo,
	disabled,
}: {
	column: ColumnDraft
	taskCount: number
	destination: ColumnDraft | undefined
	destinationTaskCount: number
	onUndo: () => void
	disabled: boolean
}) {
	return (
		<div
			className='space-y-2 bg-destructive/5 p-4 ring-1 ring-inset ring-destructive/30'
			role='group'
			aria-label={`Удаление колонки «${column.title}»`}
		>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<p className='flex min-w-0 items-center gap-2 text-sm font-semibold text-destructive'>
					<Trash2 aria-hidden className='size-4 shrink-0' />
					<span className='wrap-anywhere'>{column.title} · будет удалена</span>
				</p>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={onUndo}
					disabled={disabled}
					aria-label={`Отменить удаление колонки «${column.title}»`}
				>
					<Undo2 aria-hidden />
					Отменить удаление
				</Button>
			</div>
			<p className='text-sm text-muted-foreground'>
				{taskCount > 0
					? `${formatBoardTaskCount(taskCount)} → «${destination?.title || 'Новая колонка'}» · после сохранения в ней будет ${formatBoardTaskCount(destinationTaskCount)}.`
					: 'В колонке нет задач. Она будет удалена после сохранения изменений.'}
			</p>
			<p className='text-xs text-muted-foreground'>
				Пока ничего не удалено. Примените изменения общей кнопкой внизу.
			</p>
		</div>
	)
}
