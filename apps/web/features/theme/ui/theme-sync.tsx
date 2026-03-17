'use client'

import { useEffect } from 'react'

import { useHydratedStore } from '@/shared/hooks'

import { useThemeStore } from '../model/store'

function ThemeSync() {
	const theme = useHydratedStore(useThemeStore, (state) => state.theme)

	useEffect(() => {
		if (!theme) {
			return
		}

		const root = document.documentElement

		root.classList.toggle('dark', theme === 'dark')
		root.style.colorScheme = theme
	}, [theme])

	return null
}

export { ThemeSync }
