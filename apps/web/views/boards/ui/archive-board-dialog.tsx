import type { BoardView } from '@repo/types'
import {
	Button,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui'
import { Archive, X } from '@repo/ui/icons'

import { formatBoardTaskCount } from '../model/task-count'

interface ArchiveBoardDialogProps {
	view: BoardView
	desktop: boolean
	pending: boolean
	error: string | null
	cancelId: string
	onCancel: () => void
	onConfirm: () => void
}

const russianPlural = new Intl.PluralRules('ru-RU')
const columnForms: Partial<Record<Intl.LDMLPluralRule, string>> = {
	one: 'колонка',
	few: 'колонки',
	many: 'колонок',
}

export function ArchiveBoardDialog({
	view,
	desktop,
	pending,
	error,
	cancelId,
	onCancel,
	onConfirm,
}: ArchiveBoardDialogProps) {
	const Header = desktop ? DialogHeader : SheetHeader
	const Title = desktop ? DialogTitle : SheetTitle
	const Description = desktop ? DialogDescription : SheetDescription
	const taskCount = view.columns.reduce((total, column) => total + column.tasks.length, 0)
	const columns = `${view.columns.length} ${columnForms[russianPlural.select(view.columns.length)] ?? 'колонок'}`
	const tasks = formatBoardTaskCount(taskCount)
	return (
		<>
			<Header className='shrink-0 px-4 pt-7 pb-5 text-left sm:px-7'>
				<Title className='pr-8 text-2xl leading-8'>Архивировать доску</Title>
				<Description className='sr-only'>
					Подтвердите архивацию доски «{view.board.name}». Данные не удаляются.
				</Description>
			</Header>
			<Button
				type='button'
				variant='ghost'
				size='icon-lg'
				className='absolute top-4 right-4'
				aria-label='Вернуться к настройкам'
				disabled={pending}
				onClick={onCancel}
			>
				<X aria-hidden className='size-5' />
			</Button>
			<div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-7 sm:px-7'>
				<div className='space-y-1'>
					<p className='text-lg leading-7 font-semibold break-words'>{view.board.name}</p>
					<p className='text-sm leading-5 text-muted-foreground'>
						{columns} · {tasks}
					</p>
				</div>
				<div className='space-y-2 rounded-[var(--radius-control)] border border-primary/20 bg-primary/5 p-3.5'>
					<p className='text-base leading-6 font-semibold text-primary'>
						{taskCount === 0
							? 'В архив перейдёт пустая доска'
							: `В архив перейдут доска и ${tasks}`}
					</p>
					<p className='text-sm leading-5 text-muted-foreground'>
						{taskCount === 0
							? `Доска «${view.board.name}» и её ${columns} будут архивированы и исчезнут из активного списка. Данные не удаляются.`
							: `Доска «${view.board.name}», её ${columns} и ${russianPlural.select(taskCount) === 'one' ? '' : 'все '}${tasks} будут архивированы. Они исчезнут из активных списков проекта, но данные не удаляются.`}
					</p>
				</div>
				<p className='text-xs leading-4 text-muted-foreground'>
					Несохранённые изменения настроек не будут применены.
				</p>
				{error && (
					<p role='alert' className='text-sm leading-5 text-destructive'>
						{error}
					</p>
				)}
			</div>
			<footer className='flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-4 py-5 sm:px-7'>
				<Button
					id={cancelId}
					type='button'
					variant='outline'
					size='lg'
					disabled={pending}
					onClick={onCancel}
				>
					Отмена
				</Button>
				<Button type='button' size='lg' disabled={pending} onClick={onConfirm}>
					<Archive aria-hidden />
					{pending ? 'Архивируем…' : 'Архивировать доску'}
				</Button>
			</footer>
		</>
	)
}
