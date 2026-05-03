import { useState } from 'react'

import { createTeamSchema } from '@repo/types'

type UseCreateTeamFormReturn = {
	name: string
	nameError: string | null
	isValid: boolean
	setName: (value: string) => void
	onSubmit: () => string | null
	reset: () => void
}

function useCreateTeamForm(): UseCreateTeamFormReturn {
	const [name, setNameState] = useState('')
	const [submitted, setSubmitted] = useState(false)

	const validation = createTeamSchema.shape.name.safeParse(name.trim())
	const isValid = validation.success
	const validationError = validation.success
		? null
		: (validation.error.issues[0]?.message ?? null)
	const nameError = submitted ? validationError : null

	const setName = (value: string) => {
		setNameState(value)
	}

	const onSubmit = (): string | null => {
		setSubmitted(true)

		if (!isValid) {
			return null
		}

		return name.trim()
	}

	const reset = () => {
		setNameState('')
		setSubmitted(false)
	}

	return { name, nameError, isValid, setName, onSubmit, reset }
}

export { useCreateTeamForm }
