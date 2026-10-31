import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { LogOut } from '../icons'
import { Button } from './button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta = {
	title: 'Shared/UI/Tooltip',
	component: Tooltip,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<TooltipProvider>
				<div className='flex min-h-36 items-center p-6'>
					<Story />
				</div>
			</TooltipProvider>
		),
	],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='outline'>Наведите или сфокусируйте</Button>
			</TooltipTrigger>
			<TooltipContent side='right' sideOffset={8}>
				Подсказка появляется и при фокусе клавиатуры
			</TooltipContent>
		</Tooltip>
	),
}

export const IconAction: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='ghost' size='icon' aria-label='Выйти'>
					<LogOut className='size-4' />
				</Button>
			</TooltipTrigger>
			<TooltipContent side='right' sideOffset={8}>
				Выйти
			</TooltipContent>
		</Tooltip>
	),
}

export const Unavailable: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size='icon'
					variant='ghost'
					aria-label='Выбрать проект'
					aria-disabled='true'
					className='cursor-not-allowed opacity-50'
					onClick={(event) => event.preventDefault()}
				>
					?
				</Button>
			</TooltipTrigger>
			<TooltipContent side='right' sideOffset={8}>
				Сначала выберите команду
			</TooltipContent>
		</Tooltip>
	),
}

export const LongText: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button size='icon' variant='ghost' aria-label='Информация о команде'>
					КМ
				</Button>
			</TooltipTrigger>
			<TooltipContent side='right' sideOffset={8}>
				Команда:
				ОченьДлинноеНазваниеКомандыБезПробеловДляПроверкиПереносаТекстаИОграниченияШириныПодсказки.
				Полное название остаётся доступным при наведении и фокусе клавиатуры.
			</TooltipContent>
		</Tooltip>
	),
}

function SelectorExample() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [hintOpen, setHintOpen] = useState(false)
	return (
		<DropdownMenu
			modal={false}
			open={menuOpen}
			onOpenChange={(open) => {
				setMenuOpen(open)
				if (open) setHintOpen(false)
			}}
		>
			<Tooltip open={hintOpen && !menuOpen} onOpenChange={setHintOpen}>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button size='icon' variant='ghost' aria-label='Выбрать команду'>
							КМ
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent side='right' sideOffset={8}>
					Выбрать команду
				</TooltipContent>
			</Tooltip>
			<DropdownMenuContent side='right' sideOffset={8}>
				<DropdownMenuItem>Команда продукта</DropdownMenuItem>
				<DropdownMenuItem>Команда разработки</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export const WithDropdown: Story = { render: () => <SelectorExample /> }
export const Light: Story = { ...IconAction, globals: { theme: 'light' } }
export const Dark: Story = { ...IconAction, globals: { theme: 'dark' } }
