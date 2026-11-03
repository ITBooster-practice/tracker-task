import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'
import { Label } from './label'

const meta = {
	title: 'Shared/UI/Label',
	component: Label,
	tags: ['autodocs'],
	args: { children: 'Название доски', htmlFor: 'board-name' },
	render: (args) => (
		<div className='w-72 space-y-2'>
			<Label {...args} />
			<Input id={args.htmlFor} required={args.required} placeholder='Основная доска' />
		</div>
	),
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Required: Story = { args: { required: true } }
