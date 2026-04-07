import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'

const meta = {
	title: 'Shared/UI/Badge',
	component: Badge,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
		},
		asChild: {
			control: false,
		},
	},
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
	args: { children: 'Badge', variant: 'default' },
}

export const Secondary: Story = {
	args: { children: 'Badge', variant: 'secondary' },
}

export const Destructive: Story = {
	args: { children: 'Badge', variant: 'destructive' },
}

export const Outline: Story = {
	args: { children: 'Badge', variant: 'outline' },
}

export const Ghost: Story = {
	args: { children: 'Badge', variant: 'ghost' },
}

export const Link: Story = {
	args: { children: 'Badge', variant: 'link' },
}

export const CustomColor: Story = {
	args: {
		children: 'Custom',
		variant: 'outline',
		className:
			'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/20 dark:text-violet-200',
	},
}

export const AsChild: Story = {
	render: () => (
		<Badge variant='outline' asChild>
			<a href='#'>Link badge</a>
		</Badge>
	),
}

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-2'>
			<Badge variant='default'>Default</Badge>
			<Badge variant='secondary'>Secondary</Badge>
			<Badge variant='destructive'>Destructive</Badge>
			<Badge variant='outline'>Outline</Badge>
			<Badge variant='ghost'>Ghost</Badge>
			<Badge variant='link'>Link</Badge>
		</div>
	),
}
