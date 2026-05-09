'use client'

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

import { useUpdateProject } from '@/shared/api/use-projects'
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
import { useEditProjectForm } from '../model/use-edit-project-form'

interface EditProjectDialogProps {
	teamId: string
	projectId: string
	initialName: string
	initialDescription: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

function EditProjectDialog({
	teamId,
	projectId,
	initialName,
	initialDescription,
	open,
	onOpenChange,
}: EditProjectDialogProps) {
	const { mutateAsync: updateProject, isPending } = useUpdateProject()
	const { name, description, isValid, setName, setDescription, getData } =
		useEditProjectForm(initialName, initialDescription)

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!isValid) return

		try {
			await updateProject({ teamId, projectId, data: getData() })
			onOpenChange(false)
			toast.success('Проект обновлён')
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	return (
		<DialogDrawer open={open} onOpenChange={onOpenChange}>
			<DialogDrawerContent className={projectDialogContentClassName}>
				<form onSubmit={handleSubmit}>
					<DialogDrawerHeader>
						<DialogDrawerTitle className={projectDialogTitleClassName}>
							Редактировать проект
						</DialogDrawerTitle>
					</DialogDrawerHeader>

					<VStack spacing='md' className='p-4'>
						<div>
							<Label htmlFor='edit-project-name' className={projectDialogLabelClassName}>
								Название
							</Label>
							<Input
								id='edit-project-name'
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
								className={projectDialogInputClassName}
							/>
						</div>

						<div>
							<Label
								htmlFor='edit-project-description'
								className={projectDialogLabelClassName}
							>
								Описание
							</Label>
							<Input
								id='edit-project-description'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
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
							disabled={!isValid || isPending}
							className={projectDialogPrimaryButtonClassName}
						>
							{isPending ? 'Сохранение...' : 'Сохранить'}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { EditProjectDialog }
