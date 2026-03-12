'use client'

import { useCreateTeam } from '@/hooks/api/use-teams'
import { isApiError } from '@/lib/api/utils'
import { ROUTES } from '@/shared/config/routes'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	toast,
} from '@repo/ui'

import {
	teamDialogContentClassName,
	teamDialogFooterClassName,
	teamDialogFormClassName,
	teamDialogHeaderClassName,
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

	const closeDialog = () => {
		router.replace(ROUTES.teams)
	}

	const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const trimmedName = newName.trim()

		if (!trimmedName) {
			return
		}

		try {
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
		<Dialog open onOpenChange={(open) => !open && closeDialog()}>
			<DialogContent className={teamDialogContentClassName}>
				<form onSubmit={handleCreate} className={teamDialogFormClassName}>
					<DialogHeader className={teamDialogHeaderClassName}>
						<DialogTitle className={teamDialogTitleClassName}>
							Создать команду
						</DialogTitle>
						<DialogDescription>
							Добавьте новую команду для работы над отдельным направлением.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-1.5'>
							<Label htmlFor='team-name' className={teamDialogLabelClassName}>
								Название команды
							</Label>
							<Input
								id='team-name'
								placeholder='Например: Product Team'
								value={newName}
								onChange={(event) => setNewName(event.target.value)}
								autoFocus
								className={teamDialogInputClassName}
							/>
						</div>
					</div>

					<DialogFooter className={teamDialogFooterClassName}>
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export { CreateTeamDialog }
