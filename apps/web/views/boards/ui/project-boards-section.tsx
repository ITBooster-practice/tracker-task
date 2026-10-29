'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { FEATURE_KEYS, type BoardListItem } from '@repo/types'
import { Badge, Button, Skeleton } from '@repo/ui'
import { KanbanSquare, Plus, Trash2 } from '@repo/ui/icons'

import { useBoardsList } from '@/shared/api/use-boards'
import { teamRoutes } from '@/shared/config'
import { useFeature } from '@/shared/lib/feature-flags/context'

import { CreateBoardDialog } from './create-board-dialog'
import { DeleteBoardDialog } from './delete-board-dialog'

const createdAtFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
})

function ProjectBoardsContent({
	teamId,
	projectId,
}: {
	teamId: string
	projectId: string
}) {
	const router = useRouter()
	const query = useBoardsList(teamId, projectId)
	const [creating, setCreating] = useState(false)
	const [pendingDelete, setPendingDelete] = useState<BoardListItem | null>(null)
	const boardToDelete =
		pendingDelete &&
		(query.data?.find((board) => board.id === pendingDelete.id) ?? pendingDelete)

	return (
		<section aria-labelledby='project-boards-heading' className='mb-6 space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h2 id='project-boards-heading' className='text-xl font-semibold'>
					Доски
				</h2>
				<Button variant='outline' onClick={() => setCreating(true)}>
					<Plus aria-hidden='true' />
					Создать доску
				</Button>
			</div>
			{query.isPending ? (
				<div
					role='status'
					aria-label='Загрузка списка досок'
					className='grid gap-4 sm:grid-cols-2'
				>
					<Skeleton className='h-32 rounded-[var(--radius-surface)]' />
					<Skeleton className='h-32 rounded-[var(--radius-surface)]' />
				</div>
			) : (
				<>
					{query.isError && (
						<div
							role='alert'
							className='flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-surface)] border border-border bg-card p-4'
						>
							<p className='text-sm text-destructive'>
								Не удалось загрузить список досок.
							</p>
							<Button
								variant='outline'
								onClick={() => {
									void query.refetch()
								}}
							>
								Повторить
							</Button>
						</div>
					)}
					{query.data && query.data.length > 0 ? (
						<ul className='grid gap-4 sm:grid-cols-2'>
							{query.data.map((board) => (
								<li
									key={board.id}
									className='flex min-w-0 items-start rounded-[var(--radius-surface)] border border-border bg-card text-card-foreground'
								>
									<Link
										href={teamRoutes.projectBoard(teamId, projectId, board.id)}
										className='min-w-0 flex-1 space-y-3 rounded-[var(--radius-surface)] p-4 transition-colors hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring'
										aria-label={`Открыть доску «${board.name}»`}
									>
										<div className='flex flex-wrap items-center gap-2'>
											<KanbanSquare
												aria-hidden='true'
												className='size-4 shrink-0 text-primary'
											/>
											<h3 className='min-w-0 text-lg leading-7 font-semibold break-words'>
												{board.name}
											</h3>
											{board.isDefault && <Badge variant='secondary'>Основная</Badge>}
										</div>
										<div className='space-y-1 text-sm text-muted-foreground'>
											<p>Задач: {board.taskCount}</p>
											<p>
												Создана{' '}
												<time dateTime={board.createdAt}>
													{createdAtFormatter.format(new Date(board.createdAt))}
												</time>
											</p>
										</div>
									</Link>
									{!board.isDefault && (
										<Button
											type='button'
											variant='ghost'
											size='icon'
											className='m-2 shrink-0 text-destructive hover:text-destructive'
											aria-label={`Удалить доску «${board.name}»`}
											onClick={() => setPendingDelete(board)}
										>
											<Trash2 aria-hidden='true' />
										</Button>
									)}
								</li>
							))}
						</ul>
					) : (
						!query.isError && (
							<div className='rounded-[var(--radius-surface)] border border-dashed border-border bg-card px-5 py-8 text-base text-muted-foreground'>
								Пока нет досок. Создайте первую доску для проекта.
							</div>
						)
					)}
				</>
			)}
			<CreateBoardDialog
				open={creating}
				teamId={teamId}
				projectId={projectId}
				onOpenChange={setCreating}
				onCreated={(board) =>
					router.push(teamRoutes.projectBoard(teamId, projectId, board.id))
				}
			/>
			{boardToDelete && (
				<DeleteBoardDialog
					key={boardToDelete.id}
					board={boardToDelete}
					teamId={teamId}
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open) setPendingDelete(null)
					}}
				/>
			)}
		</section>
	)
}

export function ProjectBoardsSection(props: { teamId: string; projectId: string }) {
	const enabled = useFeature(FEATURE_KEYS.BOARDS)
	if (!enabled) return null
	return (
		<ProjectBoardsContent
			key={JSON.stringify([props.teamId, props.projectId])}
			{...props}
		/>
	)
}
