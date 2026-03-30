'use client'

import { useEffect, useState } from 'react'

import {
	Button,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
	VStack,
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
		<DialogDrawer open={open} onOpenChange={onOpenChange}>
			<DialogDrawerContent className={projectDialogContentClassName}>
				<form onSubmit={handleSubmit}>
					<DialogDrawerHeader>
						<DialogDrawerTitle className={projectDialogTitleClassName}>
							Создать проект
						</DialogDrawerTitle>
					</DialogDrawerHeader>

					<VStack spacing='md' className='p-4'>
						<div>
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

						<div>
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
					</VStack>

					<DialogDrawerFooter className={projectDialogFooterClassName}>
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
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { CreateProjectDialog }
