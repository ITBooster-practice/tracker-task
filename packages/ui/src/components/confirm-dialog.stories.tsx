import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Button } from './button'
import { ConfirmDialog } from './confirm-dialog'

const meta = {
	title: 'Shared/UI/ConfirmDialog',
	component: ConfirmDialog,
	tags: ['autodocs'],
	argTypes: {
		onConfirm: { control: false },
		onOpenChange: { control: false },
		children: { control: false },
		className: { control: false },
	},
	args: {
		title: 'Удалить проект?',
		description: 'Это действие нельзя отменить. Все связанные данные будут удалены.',
		confirmLabel: 'Удалить',
		pendingLabel: 'Удаление...',
		cancelLabel: 'Отмена',
		confirmVariant: 'destructive',
		showCloseButton: false,
		isPending: false,
		confirmDisabled: false,
	},
} satisfies Meta<typeof ConfirmDialog>

export default meta

type Story = StoryObj<typeof ConfirmDialog>

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = React.useState(false)

		return (
			<>
				<Button onClick={() => setOpen(true)}>Открыть диалог</Button>
				<ConfirmDialog
					{...args}
					open={open}
					onOpenChange={setOpen}
					onConfirm={() => setOpen(false)}
				/>
			</>
		)
	},
}

export const WithCustomContent: Story = {
	render: (args) => {
		const [open, setOpen] = React.useState(false)

		return (
			<>
				<Button onClick={() => setOpen(true)}>Открыть диалог</Button>
				<ConfirmDialog
					{...args}
					open={open}
					onOpenChange={setOpen}
					onConfirm={() => setOpen(false)}
				>
					<div className='rounded-[var(--radius-control)] border border-border bg-muted/40 p-3 text-sm text-muted-foreground'>
						Вы удаляете проект <strong className='text-foreground'>Tracker Task</strong>.
					</div>
				</ConfirmDialog>
			</>
		)
	},
}
