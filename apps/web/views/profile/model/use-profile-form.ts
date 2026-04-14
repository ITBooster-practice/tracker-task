import { useEffect, useState } from 'react'

type ProfileFormSource = {
	name?: string | null
	email?: string | null
}

function useProfileForm(profile?: ProfileFormSource | null) {
	const [formName, setFormName] = useState('')
	const [formEmail, setFormEmail] = useState('')

	useEffect(() => {
		if (!profile) {
			return
		}

		setFormName(profile.name ?? '')
		setFormEmail(profile.email ?? '')
	}, [profile?.email, profile?.name])

	const isDirty =
		formName !== (profile?.name ?? '') || formEmail !== (profile?.email ?? '')

	return {
		formName,
		formEmail,
		isDirty,
		setFormName,
		setFormEmail,
	}
}

export { useProfileForm }
