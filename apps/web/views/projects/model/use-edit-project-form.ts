import { useEffect, useState } from 'react'

import { updateProjectSchema } from '@repo/types'

type UseEditProjectFormReturn = {
	name: string
	description: string
	isValid: boolean
	setName: (value: string) => void
	setDescription: (value: string) => void
	getData: () => { name: string; description?: string }
}

function useEditProjectForm(
	initialName: string,
	initialDescription: string,
): UseEditProjectFormReturn {
	const [name, setName] = useState(initialName)
	const [description, setDescription] = useState(initialDescription)

	useEffect(() => {
		setName(initialName)
		setDescription(initialDescription)
	}, [initialName, initialDescription])

	const validation = updateProjectSchema.safeParse({
		name: name.trim() || undefined,
		description: description.trim() || undefined,
	})
	const isValid = validation.success && name.trim().length > 0

	return {
		name,
		description,
		isValid,
		setName,
		setDescription,
		getData: () => ({
			name: name.trim(),
			description: description.trim() || undefined,
		}),
	}
}

export { useEditProjectForm }
