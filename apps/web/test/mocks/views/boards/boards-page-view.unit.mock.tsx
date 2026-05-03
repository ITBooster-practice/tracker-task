import { vi } from 'vitest'

type BoardMockProps = {
	columns: Array<{ tasks: Array<{ id: string }> }>
	disableInteraction?: boolean
	onCreateTask?: () => void
	onMoveTask: (input: { taskId: string; toColumnId: string; toIndex: number }) => void
	onOpenTask: (taskId: string) => void
}

type BoardTaskDetailsDialogMockProps = {
	task: { id: string } | null
	commentDraft: string
	isSubmitDisabled: boolean
	onCommentDraftChange: (value: string) => void
	onDeleteTask?: (task: { id: string }) => void
	onEditTask?: (task: { id: string }) => void
	onOpenChange: (open: boolean) => void
	onSubmitComment: (event: React.FormEvent<HTMLFormElement>) => void
}

type BoardTaskFormDialogMockProps = {
	open: boolean
	mode: 'create' | 'edit'
	task: { id: string } | null
	onOpenChange: (open: boolean) => void
	onSubmit: (values: {
		title: string
		description: string
		columnId: string
		priority: string
		assigneeId: string
		deadline: string
		tags: string[]
	}) => void
}

const boardsPageViewMockState = vi.hoisted(() => ({
	boardCallCount: 0,
	boardLastProps: null as BoardMockProps | null,
	boardTaskFormDialogCallCount: 0,
	boardTaskFormDialogLastProps: null as BoardTaskFormDialogMockProps | null,
	boardTaskDialogCallCount: 0,
	boardTaskDialogLastProps: null as BoardTaskDetailsDialogMockProps | null,
}))

export function resetBoardsPageViewUnitMocks() {
	boardsPageViewMockState.boardCallCount = 0
	boardsPageViewMockState.boardLastProps = null
	boardsPageViewMockState.boardTaskFormDialogCallCount = 0
	boardsPageViewMockState.boardTaskFormDialogLastProps = null
	boardsPageViewMockState.boardTaskDialogCallCount = 0
	boardsPageViewMockState.boardTaskDialogLastProps = null
}

export function getBoardMockState() {
	return {
		callCount: boardsPageViewMockState.boardCallCount,
		lastProps: boardsPageViewMockState.boardLastProps,
	}
}

export function getBoardTaskFormDialogMockState() {
	return {
		callCount: boardsPageViewMockState.boardTaskFormDialogCallCount,
		lastProps: boardsPageViewMockState.boardTaskFormDialogLastProps,
	}
}

export function getBoardTaskDetailsDialogMockState() {
	return {
		callCount: boardsPageViewMockState.boardTaskDialogCallCount,
		lastProps: boardsPageViewMockState.boardTaskDialogLastProps,
	}
}

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	EmptyState: ({
		title,
		description,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
	}) => (
		<section data-testid='empty-state'>
			<h2>{title}</h2>
			{description ? <p>{description}</p> : null}
			{action}
		</section>
	),
	ConfirmDialog: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
		open ? (
			<div data-testid='confirm-dialog'>
				<button type='button' onClick={onConfirm}>
					confirm
				</button>
			</div>
		) : null,
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
	Select: ({
		children,
		value,
		onValueChange,
	}: React.PropsWithChildren<{ value: string; onValueChange: (v: string) => void }>) => (
		<div data-testid='select' data-value={value} data-on-change={String(!!onValueChange)}>
			{children}
		</div>
	),
	SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
	SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
		<div data-value={value}>{children}</div>
	),
}))

vi.mock('@/views/boards/ui/board', () => ({
	Board: (props: BoardMockProps) => {
		boardsPageViewMockState.boardCallCount += 1
		boardsPageViewMockState.boardLastProps = props

		return (
			<div data-testid='board' data-disabled={String(Boolean(props.disableInteraction))}>
				{props.columns.flatMap((column) => column.tasks).length}
				{props.onCreateTask && (
					<button type='button' onClick={props.onCreateTask}>
						Создать задачу
					</button>
				)}
			</div>
		)
	},
}))

vi.mock('@/views/boards/ui/board-toolbar', () => ({
	BoardToolbar: ({
		query,
		hasActiveFilters,
	}: {
		query: string
		hasActiveFilters: boolean
	}) => (
		<div data-testid='board-toolbar'>
			{query}:{String(hasActiveFilters)}
		</div>
	),
}))

vi.mock('@/views/boards/ui/board-task-details-dialog', () => ({
	BoardTaskDetailsDialog: (props: BoardTaskDetailsDialogMockProps) => {
		boardsPageViewMockState.boardTaskDialogCallCount += 1
		boardsPageViewMockState.boardTaskDialogLastProps = props

		return <div data-testid='task-dialog'>{props.task?.id ?? 'closed'}</div>
	},
}))

vi.mock('@/views/boards/ui/board-task-form-dialog', () => ({
	BoardTaskFormDialog: (props: BoardTaskFormDialogMockProps) => {
		boardsPageViewMockState.boardTaskFormDialogCallCount += 1
		boardsPageViewMockState.boardTaskFormDialogLastProps = props

		return props.open ? (
			<div data-testid={`task-form-${props.mode}`}>
				<button
					type='button'
					onClick={() =>
						props.onSubmit({
							title: 'Новая задача',
							description: 'Описание',
							columnId: 'TODO',
							priority: 'HIGH',
							assigneeId: 'anna',
							deadline: '2026-05-10',
							tags: ['ui'],
						})
					}
				>
					submit {props.mode}
				</button>
			</div>
		) : null
	},
}))
