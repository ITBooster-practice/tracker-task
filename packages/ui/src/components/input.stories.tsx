import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'

const meta = {
	title: 'Shared/UI/Input',
	tags: ['autodocs'],
	component: Input,
	argTypes: {
		type: {
			control: 'select',
			options: ['text', 'password', 'email', 'number', 'file'],
		},
	},
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
	args: {
		placeholder: 'placeholder',
		value: '',
	},
}

export const Disabled: Story = {
	args: {
		disabled: true,
		placeholder: 'placeholder',
		value: '',
	},
}

export const FileInput: Story = {
	args: {
		type: 'file',
	},
}

export const Invalid: Story = {
	args: {
		placeholder: 'placeholder',
		value: '',
		'aria-invalid': true,
	},
}
