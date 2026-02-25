'use client'

import { Button, MoonIcon, SunIcon } from '@repo/ui'

import { useHydratedStore } from '../../../shared/hooks'
import { useThemeStore } from '../model/store'

export const ThemeToggle = () => {
	const theme = useHydratedStore(useThemeStore, (state) => state.theme)
	const toggleTheme = useThemeStore((state) => state.toggleTheme)

	if (!theme) {
		// тут можно рисовать скелетон
		return null
	}

	const Icon = theme === 'light' ? SunIcon : MoonIcon

	return (
		<Button onClick={toggleTheme} variant='outline' size='icon'>
			<Icon className='w-5 h-5' />
		</Button>
	)
}
