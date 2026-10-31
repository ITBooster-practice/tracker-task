import type { Meta, StoryObj } from '@storybook/react-vite'

import { LogOut } from '../icons'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { UserSummary } from './user-summary'

const meta = {
	title: 'Shared/UI/UserSummary',
	component: UserSummary,
	argTypes: { renderProfileLink: { control: false } },
	tags: ['autodocs'],
	args: {
		name: 'Ирина Иванова',
		initials: 'ИИ',
		roleLabel: 'Участник',
		roleDescription: 'Участник команды «Разработка»',
		roleTone: 'member',
	},
	decorators: [
		(Story, { args }) => (
			<div
				className={
					args.collapsed
						? 'w-12 bg-sidebar p-2 text-sidebar-foreground'
						: 'w-56 bg-sidebar p-3 text-sidebar-foreground'
				}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof UserSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Initials: Story = {}

export const Photo: Story = {
	args: { avatarSrc: 'https://github.com/shadcn.png' },
}

export const LongName: Story = {
	args: {
		name: 'Александра Константиновна Долгопольская',
		initials: 'АК',
		roleLabel: 'Администратор',
		roleDescription: 'Администратор команды «Разработка»',
		roleTone: 'admin',
	},
}

export const Roles: Story = {
	render: (args) => (
		<div className='flex flex-col gap-4'>
			{(
				[
					['owner', 'Владелец'],
					['admin', 'Администратор'],
					['member', 'Участник'],
				] as const
			).map(([roleTone, roleLabel]) => (
				<UserSummary
					{...args}
					key={roleLabel}
					roleLabel={roleLabel}
					roleDescription={`${roleLabel} команды «Разработка»`}
					roleTone={roleTone}
				/>
			))}
		</div>
	),
}

export const Neutral: Story = {
	args: {
		roleLabel: 'Роль не определена',
		roleDescription: 'Нет выбранной команды или проекта',
		neutral: true,
	},
}

export const Loading: Story = {
	args: {
		name: 'Пользователь',
		initials: 'П',
		roleLabel: 'Роль не определена',
		roleDescription: 'Роль в текущем контексте загружается',
		neutral: true,
		pending: true,
	},
}

export const Collapsed: Story = { args: { collapsed: true } }

export const Owner: Story = {
	args: {
		roleLabel: 'Владелец',
		roleDescription: 'Владелец команды «Разработка»',
		roleTone: 'owner',
	},
}
export const Light: Story = { ...Owner, globals: { theme: 'light' } }
export const Dark: Story = { ...Owner, globals: { theme: 'dark' } }

export const ShortName: Story = {
	args: { ...Owner.args, name: 'Макс', initials: 'М' },
}

export const ShortNameNeutral: Story = {
	args: { ...Neutral.args, name: 'Макс', initials: 'М' },
}

export const ProfileActions: Story = {
	args: {
		renderProfileLink: (children, className) => (
			<a href='#profile' className={className} aria-label='Личный кабинет'>
				{children}
			</a>
		),
	},
	render: (args) => (
		<div
			className={
				args.collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'
			}
		>
			<UserSummary {...args} className={args.collapsed ? 'w-full' : 'flex-1'} />
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button type='button' variant='ghost' size='icon-sm' aria-label='Выйти'>
							<LogOut className='size-4' />
						</Button>
					</TooltipTrigger>
					<TooltipContent side='right'>Выйти</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	),
}

export const CollapsedActions: Story = {
	...ProfileActions,
	args: { ...ProfileActions.args, collapsed: true },
}
