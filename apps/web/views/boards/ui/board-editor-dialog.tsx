'use client'

import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

import { createBoardSchema, type BoardListItem, type BoardView } from '@repo/types'
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Textarea,
	toast,
	useMediaQuery,
	useOverlayClose,
} from '@repo/ui'
import { Archive, Plus } from '@repo/ui/icons'

import { useArchiveBoard, useCreateBoard, useUpdateBoard } from '@/shared/api/use-boards'
import { isApiError } from '@/shared/lib/api/utils'

import {
	columnDraftDestination,
	columnDraftTaskCount,
	initialColumns,
	newColumn,
	removeColumnDraft,
	restoreColumnDraft,
	type ColumnDraft,
} from '../model/board-editor'
import { ArchiveBoardDialog } from './archive-board-dialog'
import { ColumnDraftPreview, ColumnDraftRow } from './board-column-draft-row'
import { ColumnRemovalConfirmation, ColumnRemovalSummary } from './board-column-removal'

interface BoardEditorDialogProps {
	teamId: string
	projectId: string
	projectName?: string
	view?: BoardView
	selectedColumnId?: string
	onClose: () => void
	onSaved?: (board: BoardListItem) => void
	onArchived?: () => void
}

function BoardEditorDialogForm({
	teamId,
	projectId,
	projectName,
	view,
	selectedColumnId,
	onClose,
	onSaved,
	onArchived,
}: BoardEditorDialogProps) {
	const id = useId()
	const desktop = useMediaQuery('(min-width: 1280px)')
	const [opener] = useState(() =>
		typeof document === 'undefined'
			? null
			: selectedColumnId
				? document.getElementById(`board-column-menu-${selectedColumnId}`)
				: (document.activeElement as HTMLElement | null),
	)
	const [name, setName] = useState(view?.board.name ?? '')
	const [description, setDescription] = useState(view?.board.description ?? '')
	const [columns, setColumns] = useState<ColumnDraft[]>(() =>
		view
			? view.columns.map((column) => ({
					localId: column.id,
					id: column.id,
					key: column.key,
					title: column.title,
					color: column.color,
					isSystem: column.isSystem,
					taskCount: column.tasks.length,
				}))
			: initialColumns(),
	)
	const [selectedId, setSelectedId] = useState(selectedColumnId ?? null)
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [targetKey, setTargetKey] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [archiving, setArchiving] = useState(false)
	const [archiveError, setArchiveError] = useState<string | null>(null)
	const create = useCreateBoard()
	const update = useUpdateBoard()
	const submitting = useRef(false)
	const mounted = useRef(true)
	const baseline = useRef(view)
	const outcome = useRef<
		{ kind: 'saved'; board: BoardListItem } | { kind: 'archived' } | null
	>(null)
	const { open, close, completeClose } = useOverlayClose(() => {
		if (outcome.current?.kind === 'saved') onSaved?.(outcome.current.board)
		if (outcome.current?.kind === 'archived') {
			toast.success('Доска архивирована')
			onArchived?.()
		}
		onClose()
	})
	const archive = useArchiveBoard({
		onArchived: async () => {
			if (!mounted.current) return
			outcome.current = { kind: 'archived' }
			await close()
		},
	})
	const pending = create.isPending || update.isPending || archive.isPending || !open
	const returnToEditor = () => {
		if (submitting.current) return
		setArchiving(false)
		requestAnimationFrame(() => document.getElementById(`${id}-archive`)?.focus())
	}
	useEffect(() => {
		if (archiving)
			requestAnimationFrame(() =>
				document.getElementById(`${id}-archive-cancel`)?.focus(),
			)
	}, [archiving, id])
	const handleArchive = async () => {
		const board = baseline.current
		if (submitting.current || !board) return
		submitting.current = true
		setArchiveError(null)
		try {
			await archive.mutateAsync({
				teamId,
				projectId,
				boardId: board.board.id,
				data: { expectedUpdatedAt: board.board.updatedAt },
			})
		} catch (cause) {
			if (mounted.current)
				setArchiveError(
					isApiError(cause) && cause.statusCode === 403
						? 'Архивировать доску могут владелец и администратор команды.'
						: isApiError(cause) && cause.statusCode === 404
							? 'Доска недоступна. Возможно, она уже архивирована или удалена.'
							: isApiError(cause) && cause.statusCode === 409
								? 'Доска изменилась. Закройте настройки и откройте их заново, чтобы загрузить актуальные данные.'
								: 'Не удалось архивировать доску. Данные не изменены. Повторите попытку.',
				)
		} finally {
			submitting.current = false
		}
	}
	const activeColumns = columns.filter((column) => !column.removedTo)
	const removed = columns.filter((column) => column.removedTo)
	const dragging = activeColumns.find((column) => column.localId === draggingId)
	const sourceColumn = baseline.current?.columns.find(
		(column) => column.id === selectedColumnId,
	)
	const draft = createBoardSchema.safeParse({
		name,
		description: description || null,
		columns: activeColumns.map(({ id: columnId, key, title, color }) => ({
			...(columnId && { id: columnId }),
			key,
			title,
			color,
		})),
	})
	const validRemovals = removed.every((column) =>
		columnDraftDestination(columns, column.key),
	)
	const columnTitle = (localId: string | number) =>
		columns.find((column) => column.localId === localId)?.title.trim() || 'Новая колонка'
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	)
	const deleting = activeColumns.find((column) => column.localId === deletingId)
	const remove = (column: ColumnDraft, destination: string, requireEmpty = false) => {
		setColumns((current) =>
			removeColumnDraft(current, column.localId, destination, requireEmpty),
		)
		setDeletingId(null)
		setTargetKey('')
	}
	const requestRemoval = (column: ColumnDraft) => {
		if (pending || column.isSystem || activeColumns.length <= 1) return
		setSelectedId(column.localId)
		if (deletingId === column.localId) {
			setDeletingId(null)
			setTargetKey('')
		} else if (columnDraftTaskCount(columns, column.key) === 0) {
			const target = activeColumns.find((item) => item.localId !== column.localId)!
			remove(column, target.key, true)
		} else {
			setDeletingId(column.localId)
			setTargetKey('')
		}
	}
	const undoRemoval = (column: ColumnDraft) => {
		setColumns((current) => restoreColumnDraft(current, column.localId))
		setSelectedId(column.localId)
		setDeletingId(null)
		setTargetKey('')
		requestAnimationFrame(() => {
			document
				.getElementById(`column-draft-${column.localId}`)
				?.querySelector('button')
				?.focus()
		})
	}
	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		if (submitting.current || deleting) return
		const result = draft
		if (!result.success) {
			setError(result.error.issues[0]?.message ?? 'Проверьте поля формы')
			return
		}
		if (!validRemovals) {
			setError('Выберите, куда перенести задачи удаляемых колонок.')
			return
		}
		submitting.current = true
		setError(null)
		try {
			const board = baseline.current
			const data = result.data
			const response = board
				? await update.mutateAsync({
						teamId,
						projectId,
						boardId: board.board.id,
						data: {
							...data,
							expectedUpdatedAt: board.board.updatedAt,
							columnSnapshot: board.columns.map((column) => ({
								id: column.id,
								updatedAt: column.updatedAt,
							})),
							removedColumns: removed
								.filter((column) => column.id)
								.map((column) => ({
									id: column.id!,
									targetKey: columnDraftDestination(columns, column.key)!.key,
									...(column.requireEmpty && { requireEmpty: true }),
								})),
						},
					})
				: await create.mutateAsync({ teamId, projectId, data })
			if (mounted.current) {
				outcome.current = { kind: 'saved', board: response }
				await close()
			}
		} catch (cause) {
			if (mounted.current)
				setError(
					isApiError(cause) && cause.statusCode === 409
						? `Настройки изменились. ${cause.message} Закройте форму и откройте её заново, чтобы загрузить актуальную доску.`
						: isApiError(cause) && cause.statusCode === 403
							? 'Управлять доской могут владелец и администратор команды.'
							: 'Не удалось сохранить доску. Изменения не применены. Повторите попытку.',
				)
		} finally {
			submitting.current = false
		}
	}
	const Root = desktop ? Dialog : Sheet
	const Content = desktop ? DialogContent : SheetContent
	const Header = desktop ? DialogHeader : SheetHeader
	const Title = desktop ? DialogTitle : SheetTitle
	const Description = desktop ? DialogDescription : SheetDescription
	return (
		<Root
			open={open}
			onOpenChange={(open) => {
				if (!open && !submitting.current) {
					if (archiving) returnToEditor()
					else void close()
				}
			}}
		>
			<Content
				{...(!desktop ? { side: 'right' as const } : {})}
				showCloseButton={!archiving}
				onEscapeKeyDown={(event) => {
					if (
						event.target instanceof HTMLElement &&
						event.target.hasAttribute('data-board-column-rename')
					)
						event.preventDefault()
				}}
				className={
					desktop
						? archiving
							? 'flex max-h-[calc(100dvh-3rem)] flex-col gap-0 overflow-hidden bg-popover p-0 sm:max-w-[600px]'
							: 'flex max-h-[calc(100dvh-3rem)] flex-col gap-0 overflow-hidden bg-popover p-0 sm:max-w-[780px]'
						: 'flex h-dvh w-full flex-col gap-0 overflow-hidden bg-popover p-0 sm:max-w-[640px]'
				}
				onCloseAutoFocus={(event) => {
					event.preventDefault()
					if (opener?.isConnected) opener.focus()
					else if (view)
						document.getElementById(`board-settings-${view.board.id}`)?.focus()
					completeClose()
				}}
			>
				{archiving && baseline.current ? (
					<ArchiveBoardDialog
						boardName={baseline.current.board.name}
						columnCount={baseline.current.columns.length}
						taskCount={baseline.current.columns.reduce(
							(total, column) => total + column.tasks.length,
							0,
						)}
						closeLabel='Вернуться к настройкам'
						note='Несохранённые изменения настроек не будут применены.'
						desktop={desktop}
						pending={pending}
						error={archiveError}
						cancelId={`${id}-archive-cancel`}
						onCancel={returnToEditor}
						onConfirm={() => void handleArchive()}
					/>
				) : (
					<>
						<Header className='shrink-0 px-4 pt-7 pb-5 text-left sm:px-8'>
							<Title className='pr-6 text-2xl leading-8'>
								{view ? 'Настроить доску' : 'Создать доску'}
							</Title>
							<Description>
								{view?.board.name ?? 'Новая доска'}
								{projectName && ` · ${projectName}`}
							</Description>
						</Header>
						<form
							className='flex min-h-0 flex-1 flex-col'
							onSubmit={(event) => {
								void handleSubmit(event)
							}}
						>
							<div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-7 sm:px-8'>
								<div className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor={`${id}-name`} required>
											Название доски
										</Label>
										<Input
											id={`${id}-name`}
											required
											maxLength={100}
											value={name}
											disabled={pending}
											onChange={(event) => setName(event.target.value)}
											placeholder='Например, Спринт 13'
											className='h-11 bg-card'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor={`${id}-description`}>Описание</Label>
										<Textarea
											id={`${id}-description`}
											maxLength={2000}
											value={description}
											disabled={pending}
											onChange={(event) => setDescription(event.target.value)}
											className='min-h-20 resize-y bg-card'
										/>
									</div>
								</div>
								<section className='space-y-3' aria-label='Колонки и порядок'>
									<h2 className='text-lg font-semibold'>Колонки и порядок</h2>
									<p className='text-sm text-muted-foreground'>
										{sourceColumn
											? `Открыто из меню «${sourceColumn.title}». Выбранная колонка выделена синим.`
											: 'Перетащите колонку за значок слева, чтобы изменить порядок. Название, цвет и удаление — справа.'}
									</p>
									<DndContext
										id={`board-editor-${id}`}
										sensors={sensors}
										collisionDetection={closestCenter}
										accessibility={{
											announcements: {
												onDragStart: ({ active }) =>
													`Колонка «${columnTitle(active.id)}» выбрана для перемещения.`,
												onDragOver: ({ active, over }) =>
													over
														? `Колонка «${columnTitle(active.id)}»: позиция ${activeColumns.findIndex((column) => column.localId === over.id) + 1} из ${activeColumns.length}.`
														: 'Выберите новое место в списке колонок.',
												onDragEnd: ({ active, over }) =>
													over && active.id !== over.id
														? `Порядок колонки «${columnTitle(active.id)}» изменён в черновике.`
														: `Колонка «${columnTitle(active.id)}» осталась на прежнем месте.`,
												onDragCancel: ({ active }) =>
													`Перемещение колонки «${columnTitle(active.id)}» отменено.`,
											},
											screenReaderInstructions: {
												draggable:
													'Нажмите Пробел, чтобы взять колонку. Стрелки вверх и вниз меняют порядок. Пробел или Enter сохраняет порядок, Escape отменяет перемещение.',
											},
										}}
										onDragStart={({ active }) => {
											if (pending || deleting) return
											setDraggingId(String(active.id))
											setSelectedId(String(active.id))
										}}
										onDragCancel={() => setDraggingId(null)}
										onDragEnd={({ active, over }: DragEndEvent) => {
											setDraggingId(null)
											if (pending || deleting || !over || active.id === over.id) return
											setColumns((current) => {
												const from = current.findIndex(
													(column) => column.localId === active.id && !column.removedTo,
												)
												const to = current.findIndex(
													(column) => column.localId === over.id && !column.removedTo,
												)
												return from >= 0 && to >= 0
													? arrayMove(current, from, to)
													: current
											})
										}}
									>
										<SortableContext
											items={activeColumns.map((column) => column.localId)}
											strategy={verticalListSortingStrategy}
										>
											<div
												className='overflow-hidden rounded-[var(--radius-control)] border border-border'
												role='list'
												aria-label='Колонки доски в настройках'
											>
												{columns.map((column) => {
													const taskCount = columnDraftTaskCount(columns, column.key)
													const destination = columnDraftDestination(columns, column.key)
													return (
														<div
															key={column.localId}
															id={`column-draft-${column.localId}`}
															className='border-t border-border first:border-t-0'
															role='listitem'
														>
															{column.removedTo ? (
																<ColumnRemovalSummary
																	column={column}
																	taskCount={taskCount}
																	destination={destination}
																	destinationTaskCount={
																		destination
																			? columnDraftTaskCount(columns, destination.key)
																			: 0
																	}
																	onUndo={() => undoRemoval(column)}
																	disabled={pending}
																/>
															) : (
																<ColumnDraftRow
																	column={column}
																	taskCount={taskCount}
																	selected={selectedId === column.localId}
																	disabled={pending}
																	sortingDisabled={pending || Boolean(deleting)}
																	deleting={deletingId === column.localId}
																	canDelete={!column.isSystem && activeColumns.length > 1}
																	onSelect={() => setSelectedId(column.localId)}
																	onChange={(patch) =>
																		setColumns((current) =>
																			current.map((item) =>
																				item.localId === column.localId
																					? { ...item, ...patch }
																					: item,
																			),
																		)
																	}
																	onDelete={() => requestRemoval(column)}
																/>
															)}
															{deletingId === column.localId && (
																<ColumnRemovalConfirmation
																	column={column}
																	taskCount={taskCount}
																	targets={activeColumns.filter(
																		(item) => item.localId !== column.localId,
																	)}
																	targetKey={targetKey}
																	onTargetChange={setTargetKey}
																	onCancel={() => {
																		setDeletingId(null)
																		setTargetKey('')
																	}}
																	onConfirm={() => remove(column, targetKey)}
																	disabled={pending}
																/>
															)}
														</div>
													)
												})}
											</div>
										</SortableContext>
										{typeof document !== 'undefined' &&
											createPortal(
												<DragOverlay dropAnimation={null}>
													{dragging && (
														<ColumnDraftPreview
															column={dragging}
															taskCount={columnDraftTaskCount(columns, dragging.key)}
														/>
													)}
												</DragOverlay>,
												document.body,
											)}
									</DndContext>
									<Button
										type='button'
										variant='ghost'
										disabled={pending || Boolean(deleting) || activeColumns.length >= 50}
										onClick={() => {
											const column = newColumn()
											setColumns((current) => [...current, column])
											setSelectedId(column.localId)
										}}
									>
										<Plus aria-hidden />
										Добавить колонку
									</Button>
									<p className='text-sm text-muted-foreground'>
										{view
											? 'При удалении непустой колонки потребуется выбрать, куда перенести задачи. Системные колонки используются статусами задач и защищены от удаления.'
											: 'После создания откроется новая пустая доска. Задачи и фильтры текущей доски не переносятся.'}
									</p>
								</section>
								{removed.length > 0 && (
									<p role='status' className='text-sm text-muted-foreground'>
										Будет удалено колонок: {removed.length}. Перенос задач применится при
										сохранении.
									</p>
								)}
								{error && (
									<p role='alert' className='text-sm text-destructive'>
										{error}
									</p>
								)}
							</div>
							<footer className='flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-4 py-5 sm:px-8'>
								{view && (
									<Button
										id={`${id}-archive`}
										type='button'
										variant='ghost'
										size='lg'
										className='mr-auto text-choice-warning hover:bg-choice-warning/10 hover:text-choice-warning'
										disabled={pending}
										onClick={() => {
											setArchiveError(null)
											setArchiving(true)
										}}
									>
										<Archive aria-hidden />
										Архивировать доску
									</Button>
								)}
								<Button
									type='button'
									variant='outline'
									disabled={pending}
									onClick={() => void close()}
								>
									Отмена
								</Button>
								<Button
									type='submit'
									disabled={
										pending || Boolean(deleting) || !draft.success || !validRemovals
									}
								>
									{pending
										? 'Сохраняем…'
										: view
											? 'Сохранить изменения'
											: 'Создать доску'}
								</Button>
							</footer>
						</form>
					</>
				)}
			</Content>
		</Root>
	)
}

export function BoardEditorDialog(props: BoardEditorDialogProps) {
	return (
		<BoardEditorDialogForm
			key={JSON.stringify([props.teamId, props.projectId, props.view?.board.id])}
			{...props}
		/>
	)
}
