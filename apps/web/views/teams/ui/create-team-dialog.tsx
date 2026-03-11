'use client'

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
import { useTeamsStore } from '../model/store'

function CreateTeamDialog() {
	const router = useRouter()
	const createTeam = useTeamsStore((state) => state.createTeam)
	const [newName, setNewName] = useState('')

	const closeDialog = () => {
		router.replace('/teams')
	}

	const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const team = createTeam(newName)

		if (!team) {
			return
		}

		setNewName('')
		router.replace('/teams')
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
							disabled={!newName.trim()}
							className={teamDialogPrimaryButtonClassName}
						>
							Создать
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export { CreateTeamDialog }
