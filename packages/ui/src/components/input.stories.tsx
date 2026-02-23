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
	decorators: [
		(Story) => (
			<div style={{ width: '350px' }}>
				<Story />
			</div>
		),
	],
	args: {
		placeholder: 'placeholder',
		value: '',
	},
}

export const Disabled: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '350px' }}>
				<Story />
			</div>
		),
	],
	args: {
		disabled: true,
		placeholder: 'placeholder',
		value: '',
	},
}

export const FileInput: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '350px' }}>
				<Story />
			</div>
		),
	],
	args: {
		type: 'file',
	},
}

export const Invalid: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '350px' }}>
				<Story />
			</div>
		),
	],
	args: {
		placeholder: 'placeholder',
		value: '',
		'aria-invalid': true,
	},
}
