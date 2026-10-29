import type { ComponentProps, PropsWithChildren } from 'react'
import { vi } from 'vitest'

import type * as UI from '@repo/ui'

vi.mock('@repo/ui', () => ({
	Button: ({ children, ...props }: ComponentProps<'button'>) => (
		<button {...props}>{children}</button>
	),
	Input: (props: ComponentProps<'input'>) => <input {...props} />,
	Label: (props: ComponentProps<'label'>) => <label {...props} />,
	Select: ({
		name,
		value,
		onValueChange,
		children,
	}: ComponentProps<typeof UI.Select>) => (
		<select
			aria-label={name}
			value={value}
			onChange={(event) => onValueChange?.(event.target.value)}
		>
			{children}
		</select>
	),
	SelectTrigger: () => null,
	SelectValue: () => null,
	SelectContent: ({ children }: PropsWithChildren) => <>{children}</>,
	SelectItem: ({ value, children }: ComponentProps<typeof UI.SelectItem>) => (
		<option value={value}>{children}</option>
	),
}))
