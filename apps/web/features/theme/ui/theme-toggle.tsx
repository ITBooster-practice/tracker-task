'use client'

import { Button, cn, MoonIcon, SunIcon } from '@repo/ui'

import { useHydratedStore } from '../../../shared/hooks'
import { useThemeStore } from '../model/store'

interface ThemeToggleProps {
	className?: string
	iconClassName?: string
	size?: 'icon' | 'icon-sm' | 'icon-xs'
}

export const ThemeToggle = ({
	className,
	iconClassName,
	size = 'icon',
}: ThemeToggleProps) => {
	const theme = useHydratedStore(useThemeStore, (state) => state.theme)
	const toggleTheme = useThemeStore((state) => state.toggleTheme)

	if (!theme) {
		// тут можно рисовать скелетон
		return null
	}

	const Icon = theme === 'light' ? SunIcon : MoonIcon

	return (
		<Button onClick={toggleTheme} variant='outline' size={size} className={className}>
			<Icon className={cn('size-5', iconClassName)} />
		</Button>
	)
}
