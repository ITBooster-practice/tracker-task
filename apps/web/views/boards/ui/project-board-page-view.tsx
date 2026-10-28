'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { BoardView } from '@repo/types'
import { Button, EmptyState, Skeleton, toast } from '@repo/ui'
import { ChevronRight } from '@repo/ui/icons'

import { useBoardsList } from '@/shared/api/use-boards'
import { useProjectDetail } from '@/shared/api/use-projects'
import { useBoardQuery, useMoveTask } from '@/shared/api/use-tasks'
import { ROUTES, teamRoutes } from '@/shared/config'
import { PageHeader } from '@/shared/ui/page-header'

import { toBoardColumnsViewModel } from '../model/adapters'
import type { BoardTaskMoveInput } from '../model/types'
import { findBoardTask } from '../model/utils'
import { Board } from './board'
import { BoardTaskDetailsDialog } from './board-task-details-dialog'

interface ProjectBoardPageViewProps {
	teamId: string
	projectId: string
}

function ProjectBoardContent({ view, teamId }: { view: BoardView; teamId: string }) {
	const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)
	const moving = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const moveTask = useMoveTask({
		onError: (error) => {
			if (!mounted.current) return
			toast.error(
				error.statusCode === 409
					? 'Доска изменилась. Попробуйте переместить задачу ещё раз.'
					: 'Не удалось переместить задачу. Попробуйте ещё раз.',
			)
		},
	})
	const columns = useMemo(() => toBoardColumnsViewModel(view), [view])
	const selectedTask = findBoardTask(columns, openedTaskId)
	const hasTasks = columns.some((column) => column.tasks.length > 0)
	const handleMoveTask = ({ taskId, toColumnId, toIndex }: BoardTaskMoveInput) => {
		if (moving.current || moveTask.isPending) return
		const source = view.columns.find((column) =>
			column.tasks.some((task) => task.id === taskId),
		)
		const target = view.columns.find((column) => column.id === toColumnId)
		const task = source?.tasks.find((item) => item.id === taskId)
		if (!source || !target || !task) return
		const position = Math.min(
			Math.max(toIndex, 0),
			target.tasks.filter((item) => item.id !== taskId).length,
		)
		if (
			source.id === target.id &&
			source.tasks.findIndex((item) => item.id === taskId) === position
		)
			return
		moving.current = true
		void moveTask
			.mutateAsync({
				teamId,
				projectId: view.board.projectId,
				boardId: view.board.id,
				taskId,
				body: {
					fromColumnId: source.id,
					toColumnId,
					position,
					expectedVersion: task.version,
				},
			})
			.catch(() => undefined)
			.finally(() => {
				moving.current = false
			})
	}

	if (columns.length === 0) {
		return (
			<EmptyState
				headingLevel='h2'
				className='my-auto self-center'
				title='На доске пока нет колонок'
				description='Добавьте колонки, чтобы распределять задачи по этапам.'
			/>
		)
	}

	return (
		<>
			{!hasTasks && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='На доске пока нет задач'
					description='Задачи появятся здесь после добавления в эту доску.'
				/>
			)}
			{moveTask.isPending && (
				<span role='status' className='sr-only'>
					Сохраняем положение задачи
				</span>
			)}
			<Board
				columns={columns}
				onOpenTask={setOpenedTaskId}
				onMoveTask={handleMoveTask}
				disableInteraction={moveTask.isPending}
			/>
			<BoardTaskDetailsDialog
				task={selectedTask}
				readOnly
				onOpenChange={(open) => {
					if (!open) setOpenedTaskId(null)
				}}
			/>
		</>
	)
}

function ProjectBoardPageView({ teamId, projectId }: ProjectBoardPageViewProps) {
	const projectQuery = useProjectDetail(teamId, projectId)
	const boardsQuery = useBoardsList(teamId, projectId)
	const selectedBoard =
		boardsQuery.data?.find((board) => board.isDefault) ?? boardsQuery.data?.[0]
	const boardQuery = useBoardQuery(teamId, projectId, selectedBoard?.id ?? '')
	const isLoading =
		boardsQuery.isPending || (Boolean(selectedBoard) && boardQuery.isPending)
	const hasError = boardsQuery.isError || (Boolean(selectedBoard) && boardQuery.isError)

	const retry = () => {
		if (boardsQuery.isError || !selectedBoard) void boardsQuery.refetch()
		else void boardQuery.refetch()
	}

	return (
		<div className='flex min-h-full flex-col bg-background text-foreground'>
			<div className='mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6'>
				<PageHeader
					title={boardQuery.data?.board.name ?? selectedBoard?.name ?? 'Доска проекта'}
					description='Задачи проекта по этапам работы.'
					navigation={
						<nav
							aria-label='Хлебные крошки'
							className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'
						>
							<Link
								href={ROUTES.teams}
								className='transition-colors hover:text-foreground'
							>
								Команды
							</Link>
							<ChevronRight className='size-4' />
							<Link
								href={teamRoutes.projects(teamId)}
								className='transition-colors hover:text-foreground'
							>
								Проекты
							</Link>
							<ChevronRight className='size-4' />
							<Link
								href={teamRoutes.project(teamId, projectId)}
								className='text-sm text-muted-foreground hover:text-foreground'
							>
								{projectQuery.data?.name ?? 'Проект'}
							</Link>
							<ChevronRight className='size-4' />
							<span aria-current='page' className='text-foreground'>
								Доска
							</span>
						</nav>
					}
				/>
				{hasError ? (
					<EmptyState
						headingLevel='h2'
						className='my-auto self-center'
						title='Не удалось загрузить доску'
						description='Попробуйте повторить запрос.'
						action={<Button onClick={retry}>Повторить</Button>}
					/>
				) : isLoading ? (
					<div
						role='status'
						aria-label='Загрузка доски'
						className='flex gap-4 overflow-hidden'
					>
						{Array.from({ length: 3 }, (_, index) => (
							<Skeleton key={index} className='h-80 w-[260px] shrink-0 rounded-xl' />
						))}
					</div>
				) : !selectedBoard ? (
					<EmptyState
						headingLevel='h2'
						className='my-auto self-center'
						title='В проекте пока нет досок'
						description='После создания доски здесь появятся колонки и задачи.'
					/>
				) : boardQuery.data ? (
					<ProjectBoardContent
						key={JSON.stringify([teamId, projectId, selectedBoard.id])}
						view={boardQuery.data}
						teamId={teamId}
					/>
				) : null}
			</div>
		</div>
	)
}

export { ProjectBoardPageView }
