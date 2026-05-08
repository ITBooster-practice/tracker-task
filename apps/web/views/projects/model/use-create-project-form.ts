import { useState } from 'react'

import { createProjectSchema } from '@repo/types'

type UseCreateProjectFormReturn = {
	name: string
	description: string
	nameError: string | null
	descriptionError: string | null
	isValid: boolean
	setName: (value: string) => void
	setDescription: (value: string) => void
	onSubmit: () => { name: string; description?: string } | null
	reset: () => void
}

function useCreateProjectForm(): UseCreateProjectFormReturn {
	const [name, setNameState] = useState('')
	const [description, setDescriptionState] = useState('')
	const [submitted, setSubmitted] = useState(false)

	const validation = createProjectSchema.safeParse({
		name: name.trim(),
		description: description.trim() || undefined,
	})

	const isValid = validation.success
	const nameError = submitted
		? (validation.error?.issues.find((i) => i.path[0] === 'name')?.message ?? null)
		: null
	const descriptionError = submitted
		? (validation.error?.issues.find((i) => i.path[0] === 'description')?.message ?? null)
		: null

	const setName = (value: string) => setNameState(value)
	const setDescription = (value: string) => setDescriptionState(value)

	const onSubmit = (): { name: string; description?: string } | null => {
		setSubmitted(true)

		if (!isValid) return null

		return {
			name: name.trim(),
			description: description.trim() || undefined,
		}
	}

	const reset = () => {
		setNameState('')
		setDescriptionState('')
		setSubmitted(false)
	}

	return {
		name,
		description,
		nameError,
		descriptionError,
		isValid,
		setName,
		setDescription,
		onSubmit,
		reset,
	}
}

export { useCreateProjectForm }
