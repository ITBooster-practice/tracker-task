'use client'

import { useEffect } from 'react'

import {
	Button,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
	toast,
	VStack,
} from '@repo/ui'

import { useCreateProject } from '@/shared/api/use-projects'
import { isApiError } from '@/shared/lib/api/utils'

import {
	projectDialogContentClassName,
	projectDialogFooterClassName,
	projectDialogInputClassName,
	projectDialogLabelClassName,
	projectDialogPrimaryButtonClassName,
	projectDialogSecondaryButtonClassName,
	projectDialogTitleClassName,
} from '../lib/styles'
import { useCreateProjectForm } from '../model/use-create-project-form'

interface CreateProjectDialogProps {
	teamId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

function CreateProjectDialog({ teamId, open, onOpenChange }: CreateProjectDialogProps) {
	const { mutateAsync: createProject, isPending } = useCreateProject()
	const {
		name,
		description,
		nameError,
		descriptionError,
		isValid,
		setName,
		setDescription,
		onSubmit,
		reset,
	} = useCreateProjectForm()

	useEffect(() => {
		if (!open) reset()
	}, [open])

	const handleOpenChange = (nextOpen: boolean) => {
		onOpenChange(nextOpen)
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const data = onSubmit()
		if (!data) return

		try {
			await createProject({ teamId, data })
			reset()
			onOpenChange(false)
			toast.success('Проект создан')
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	return (
		<DialogDrawer open={open} onOpenChange={handleOpenChange}>
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
								onChange={(e) => setName(e.target.value)}
								autoFocus
								className={projectDialogInputClassName}
							/>
							{nameError && (
								<p className='mt-1.5 text-sm text-destructive'>{nameError}</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='project-description'
								className={projectDialogLabelClassName}
							>
								Описание
							</Label>
							<Input
								id='project-description'
								placeholder='Краткое описание проекта'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className={projectDialogInputClassName}
							/>
							{descriptionError && (
								<p className='mt-1.5 text-sm text-destructive'>{descriptionError}</p>
							)}
						</div>
					</VStack>

					<DialogDrawerFooter className={projectDialogFooterClassName}>
						<Button
							type='button'
							variant='outline'
							onClick={() => handleOpenChange(false)}
							className={projectDialogSecondaryButtonClassName}
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={!isValid || isPending}
							className={projectDialogPrimaryButtonClassName}
						>
							{isPending ? 'Создание...' : 'Создать'}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { CreateProjectDialog }
