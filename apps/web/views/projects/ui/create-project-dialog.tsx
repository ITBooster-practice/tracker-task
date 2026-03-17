'use client'

import { useEffect, useState } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from '@repo/ui'

import {
	isValidProjectCode,
	normalizeProjectCodeInput,
	PROJECT_CODE_MAX_LENGTH,
	PROJECT_CODE_MIN_LENGTH,
} from '@/shared/lib/projects'

import {
	projectDialogContentClassName,
	projectDialogFooterClassName,
	projectDialogFormClassName,
	projectDialogHeaderClassName,
	projectDialogInputClassName,
	projectDialogLabelClassName,
	projectDialogPrimaryButtonClassName,
	projectDialogSecondaryButtonClassName,
	projectDialogTitleClassName,
} from '../lib/styles'

interface CreateProjectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreate: (payload: { name: string; code: string }) => void
}

function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
	const [name, setName] = useState('')
	const [code, setCode] = useState('')

	useEffect(() => {
		if (!open) {
			setName('')
			setCode('')
		}
	}, [open])

	const normalizedName = name.trim()
	const normalizedCode = code.trim()
	const isSubmitDisabled =
		!normalizedName || !normalizedCode || !isValidProjectCode(normalizedCode)

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitDisabled) {
			return
		}

		onCreate({
			name: normalizedName,
			code: normalizedCode,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={projectDialogContentClassName}>
				<form onSubmit={handleSubmit} className={projectDialogFormClassName}>
					<DialogHeader className={projectDialogHeaderClassName}>
						<DialogTitle className={projectDialogTitleClassName}>
							Создать проект
						</DialogTitle>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-1.5'>
							<Label htmlFor='project-name' className={projectDialogLabelClassName}>
								Название
							</Label>
							<Input
								id='project-name'
								placeholder='Мой проект'
								value={name}
								onChange={(event) => setName(event.target.value)}
								autoFocus
								className={projectDialogInputClassName}
							/>
						</div>

						<div className='space-y-1.5'>
							<Label htmlFor='project-key' className={projectDialogLabelClassName}>
								Ключ ({PROJECT_CODE_MIN_LENGTH}-{PROJECT_CODE_MAX_LENGTH} буквы)
							</Label>
							<Input
								id='project-key'
								placeholder='MP'
								value={code}
								onChange={(event) =>
									setCode(normalizeProjectCodeInput(event.target.value))
								}
								className={projectDialogInputClassName}
							/>
						</div>
					</div>

					<DialogFooter className={projectDialogFooterClassName}>
						<Button
							type='button'
							variant='outline'
							onClick={() => onOpenChange(false)}
							className={projectDialogSecondaryButtonClassName}
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={isSubmitDisabled}
							className={projectDialogPrimaryButtonClassName}
						>
							Создать
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export { CreateProjectDialog }
