'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
	toast,
} from '@repo/ui'

import { useCreateTeam } from '@/shared/api/use-teams'
import { ROUTES } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import {
	teamDialogContentClassName,
	teamDialogFooterClassName,
	teamDialogInputClassName,
	teamDialogLabelClassName,
	teamDialogPrimaryButtonClassName,
	teamDialogSecondaryButtonClassName,
	teamDialogTitleClassName,
} from '../lib/styles'

function CreateTeamDialog() {
	const router = useRouter()
	const createTeamMutation = useCreateTeam()
	const [newName, setNewName] = useState('')
	const [nameError, setNameError] = useState<string | null>(null)

	const closeDialog = () => {
		router.replace(ROUTES.teams)
	}

	const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const trimmedName = newName.trim()

		if (!trimmedName) {
			setNameError('Название команды обязательно')
			return
		}

		try {
			setNameError(null)
			await createTeamMutation.mutateAsync({ name: trimmedName })
			setNewName('')
			router.replace(ROUTES.teams)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	return (
		<DialogDrawer open onOpenChange={(open) => !open && closeDialog()}>
			<DialogDrawerContent className={teamDialogContentClassName}>
				<form onSubmit={handleCreate}>
					<DialogDrawerHeader>
						<DialogDrawerTitle className={teamDialogTitleClassName}>
							Создать команду
						</DialogDrawerTitle>
						<DialogDrawerDescription>
							Добавьте новую команду для работы над отдельным направлением.
						</DialogDrawerDescription>
					</DialogDrawerHeader>

					<div className='p-4'>
						<Label htmlFor='team-name' className={teamDialogLabelClassName}>
							Название команды
						</Label>
						<Input
							id='team-name'
							placeholder='Например: Product Team'
							value={newName}
							onChange={(event) => {
								setNewName(event.target.value)
								if (nameError) {
									setNameError(null)
								}
							}}
							autoFocus
							className={teamDialogInputClassName}
							aria-invalid={Boolean(nameError)}
						/>
						{nameError ? (
							<p className='mt-2 text-sm text-destructive'>{nameError}</p>
						) : null}
					</div>

					<DialogDrawerFooter className={teamDialogFooterClassName}>
						<Button
							type='button'
							variant='outline'
							onClick={closeDialog}
							className={teamDialogSecondaryButtonClassName}
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={!newName.trim() || createTeamMutation.isPending}
							className={teamDialogPrimaryButtonClassName}
						>
							{createTeamMutation.isPending ? 'Создание...' : 'Создать'}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { CreateTeamDialog }
