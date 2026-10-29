'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { createBoardSchema, type BoardListItem } from '@repo/types'
import {
	Button,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerDescription,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
} from '@repo/ui'

import { useCreateBoard } from '@/shared/api/use-boards'
import { isApiError } from '@/shared/lib/api/utils'

interface CreateBoardDialogProps {
	open: boolean
	teamId: string
	projectId: string
	onOpenChange: (open: boolean) => void
	onCreated: (board: BoardListItem) => void
}

function CreateBoardForm({
	teamId,
	projectId,
	onOpenChange,
	onCreated,
}: CreateBoardDialogProps) {
	const [name, setName] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [invalidName, setInvalidName] = useState(false)
	const create = useCreateBoard()
	const submitting = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		if (submitting.current) return
		const result = createBoardSchema.safeParse({ name })
		if (!result.success) {
			setInvalidName(true)
			setError(result.error.issues[0]?.message ?? 'Проверьте название доски.')
			return
		}
		submitting.current = true
		setError(null)
		setInvalidName(false)
		try {
			const board = await create.mutateAsync({ teamId, projectId, data: result.data })
			if (mounted.current) {
				onOpenChange(false)
				onCreated(board)
			}
		} catch (cause) {
			if (mounted.current) setInvalidName(isApiError(cause) && cause.statusCode === 409)
			if (mounted.current)
				setError(
					isApiError(cause) && cause.statusCode === 403
						? 'Создавать доски могут владелец и администратор команды.'
						: isApiError(cause) && cause.statusCode === 409
							? 'Доска с таким названием уже существует в проекте.'
							: 'Не удалось создать доску. Повторите попытку.',
				)
		} finally {
			submitting.current = false
		}
	}

	return (
		<DialogDrawer
			open
			onOpenChange={(open) => {
				if (!submitting.current) onOpenChange(open)
			}}
		>
			<DialogDrawerContent className='max-h-[80dvh] overflow-y-auto border-border bg-card p-0 shadow-lg'>
				<form
					onSubmit={(event) => {
						void handleSubmit(event)
					}}
				>
					<DialogDrawerHeader className='p-6 pb-4 text-left'>
						<DialogDrawerTitle className='text-lg leading-7 font-semibold'>
							Создать доску
						</DialogDrawerTitle>
						<DialogDrawerDescription>
							Отдельная доска для задач этого проекта.
						</DialogDrawerDescription>
					</DialogDrawerHeader>
					<div className='space-y-2 px-6 pb-4'>
						<Label htmlFor='create-board-name'>Название доски</Label>
						<Input
							id='create-board-name'
							required
							maxLength={100}
							value={name}
							disabled={create.isPending}
							aria-invalid={invalidName || undefined}
							aria-describedby={error ? 'create-board-error' : undefined}
							onChange={(event) => {
								setName(event.target.value)
								setError(null)
								setInvalidName(false)
							}}
							placeholder='Например, Поддержка'
						/>
						{error && (
							<p
								id='create-board-error'
								role='alert'
								className='text-sm text-destructive'
							>
								{error}
							</p>
						)}
					</div>
					<DialogDrawerFooter className='border-t border-border p-6 pt-4'>
						<Button
							type='button'
							variant='outline'
							disabled={create.isPending}
							onClick={() => onOpenChange(false)}
						>
							Отмена
						</Button>
						<Button type='submit' disabled={create.isPending || !name.trim()}>
							{create.isPending ? 'Создаём…' : 'Создать'}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export function CreateBoardDialog(props: CreateBoardDialogProps) {
	return props.open ? (
		<CreateBoardForm key={JSON.stringify([props.teamId, props.projectId])} {...props} />
	) : null
}
