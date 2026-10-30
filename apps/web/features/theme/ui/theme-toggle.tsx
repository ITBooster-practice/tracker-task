'use client'

import { Button, cn, MoonIcon, SunIcon } from '@repo/ui'

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
	const toggleTheme = useThemeStore((state) => state.toggleTheme)

	return (
		<Button
			type='button'
			onClick={toggleTheme}
			variant='outline'
			size={size}
			className={className}
			aria-label='Переключить тему'
			title='Переключить тему'
		>
			<SunIcon
				aria-hidden='true'
				className={cn('hidden size-4 dark:block', iconClassName)}
			/>
			<MoonIcon aria-hidden='true' className={cn('size-4 dark:hidden', iconClassName)} />
		</Button>
	)
}
