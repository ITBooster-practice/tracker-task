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

import { useTeamsStore } from '../model/store'

function CreateTeamDialog() {
	const router = useRouter()
	const createTeam = useTeamsStore((state) => state.createTeam)
	const [newName, setNewName] = useState('')

	const closeDialog = () => {
		router.replace('/teams')
	}

	const handleCreate = () => {
		const team = createTeam(newName)

		if (!team) {
			return
		}

		setNewName('')
		router.replace('/teams')
	}

	return (
		<Dialog open onOpenChange={(open) => !open && closeDialog()}>
			<DialogContent className='border-border bg-card sm:max-w-[420px]'>
				<DialogHeader>
					<DialogTitle>Создать команду</DialogTitle>
					<DialogDescription>
						Добавьте новую команду для работы над отдельным направлением.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					<div className='space-y-2'>
						<Label htmlFor='team-name'>Название команды</Label>
						<Input
							id='team-name'
							placeholder='Например: Product Team'
							value={newName}
							onChange={(event) => setNewName(event.target.value)}
							autoFocus
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={closeDialog}>
						Отмена
					</Button>
					<Button onClick={handleCreate} disabled={!newName.trim()}>
						Создать
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export { CreateTeamDialog }
