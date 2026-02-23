import type { Meta, StoryObj } from '@storybook/react-vite'
import { Rocket } from 'lucide-react'

import { Button } from './button'

const meta = {
	title: 'Shared/UI/Button',
	component: Button,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
		},
		size: {
			control: 'select',
			options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
		},
		asChild: {
			control: false,
		},
	},
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
	args: {
		children: 'Click me',
		variant: 'default',
		size: 'default',
		asChild: false,
	},
}

export const Destructive: Story = {
	args: {
		children: 'Click me',
		variant: 'destructive',
		size: 'default',
		asChild: false,
	},
}

export const Outline: Story = {
	args: {
		children: 'Click me',
		variant: 'outline',
		size: 'default',
		asChild: false,
	},
}

export const Ghost: Story = {
	args: {
		children: 'Click me',
		variant: 'ghost',
		size: 'default',
		asChild: false,
	},
}

export const Link: Story = {
	args: {
		children: 'Click me',
		variant: 'link',
		size: 'default',
		asChild: false,
	},
}

export const Icon: Story = {
	args: {
		children: <Rocket />,
		variant: 'default',
		size: 'icon',
		asChild: false,
	},
}

export const AsChild: Story = {
	args: {
		children: <a>Click me</a>,
		variant: 'ghost',
		size: 'default',
		asChild: true,
	},
}
