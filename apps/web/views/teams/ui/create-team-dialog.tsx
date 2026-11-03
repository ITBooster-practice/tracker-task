'use client'

import { useRouter } from 'next/navigation'

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
	useOverlayClose,
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
import { useCreateTeamForm } from '../model/use-create-team-form'

function CreateTeamDialog() {
	const router = useRouter()
	const createTeamMutation = useCreateTeam()
	const { name, nameError, isValid, setName, onSubmit } = useCreateTeamForm()
	const { open, close, completeClose } = useOverlayClose(() => {
		router.replace(ROUTES.teams)
	})

	const closeDialog = () => {
		if (!createTeamMutation.isPending) void close()
	}

	const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!open || createTeamMutation.isPending) return

		const trimmedName = onSubmit()

		if (!trimmedName) {
			return
		}

		try {
			await createTeamMutation.mutateAsync({ name: trimmedName })
			toast.success('Команда создана')
			await close()
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}

			throw error
		}
	}

	return (
		<DialogDrawer open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
			<DialogDrawerContent
				className={teamDialogContentClassName}
				onCloseAutoFocus={completeClose}
			>
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
							value={name}
							onChange={(event) => setName(event.target.value)}
							autoFocus
							className={teamDialogInputClassName}
							disabled={createTeamMutation.isPending || !open}
						/>
						{nameError && <p className='mt-1.5 text-sm text-destructive'>{nameError}</p>}
					</div>

					<DialogDrawerFooter className={teamDialogFooterClassName}>
						<Button
							type='button'
							variant='outline'
							onClick={closeDialog}
							disabled={createTeamMutation.isPending || !open}
							className={teamDialogSecondaryButtonClassName}
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={!isValid || createTeamMutation.isPending || !open}
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
