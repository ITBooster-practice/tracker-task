import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'

const meta: Meta<typeof Avatar> = {
	title: 'Shared/UI/Avatar',
	component: Avatar,
	tags: ['autodocs'],
	argTypes: {
		size: { control: 'select', options: ['sm', 'default', 'lg'] },
	},
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src='https://github.com/shadcn.png' alt='Фото пользователя' />
			<AvatarFallback>ИИ</AvatarFallback>
		</Avatar>
	),
}

export default meta
type Story = StoryObj<typeof meta>

export const Photo: Story = {}

export const Initials: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarFallback>ИИ</AvatarFallback>
		</Avatar>
	),
}

export const UnavailablePhoto: Story = {
	render: () => (
		<Avatar>
			<AvatarImage src='/unavailable-avatar.png' alt='Фото пользователя' />
			<AvatarFallback>ИИ</AvatarFallback>
		</Avatar>
	),
}

export const Sizes: Story = {
	render: () => (
		<div className='flex items-center gap-3'>
			{(['sm', 'default', 'lg'] as const).map((size) => (
				<Avatar key={size} size={size}>
					<AvatarFallback>ИИ</AvatarFallback>
				</Avatar>
			))}
		</div>
	),
}

export const Dark: Story = { globals: { theme: 'dark' } }
