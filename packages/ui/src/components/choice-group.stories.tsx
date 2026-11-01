import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Bug, CircleDot, BookOpen, Zap, TriangleAlert } from '../icons'
import { ChoiceGroup, ChoiceGroupItem, type ChoiceTone } from './choice-group'

const options = [
	{ value: 'task', label: 'Задача', tone: 'primary', Icon: CircleDot },
	{ value: 'bug', label: 'Баг', tone: 'danger', Icon: Bug },
	{ value: 'story', label: 'История', tone: 'success', Icon: BookOpen },
	{ value: 'epic', label: 'Эпик', tone: 'accent', Icon: Zap },
	{ value: 'debt', label: 'Технический долг', tone: 'warning', Icon: TriangleAlert },
] satisfies { value: string; label: string; tone: ChoiceTone; Icon: typeof Bug }[]

function Example({
	disabled = false,
	narrow = false,
}: {
	disabled?: boolean
	narrow?: boolean
}) {
	const [value, setValue] = useState('task')
	return (
		<div className={narrow ? 'w-full max-w-72' : 'w-full max-w-2xl'}>
			<ChoiceGroup
				aria-label='Тип задачи'
				value={value}
				onValueChange={setValue}
				disabled={disabled}
			>
				{options.map(({ value, label, tone, Icon }) => (
					<ChoiceGroupItem key={value} value={value} tone={tone} icon={<Icon />}>
						{label}
					</ChoiceGroupItem>
				))}
			</ChoiceGroup>
		</div>
	)
}

const meta = {
	title: 'Shared/UI/ChoiceGroup',
	component: ChoiceGroup,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
	render: () => <Example />,
} satisfies Meta<typeof ChoiceGroup>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Light: Story = { globals: { theme: 'light' } }
export const Dark: Story = { globals: { theme: 'dark' } }
export const Narrow: Story = { render: () => <Example narrow /> }
export const Disabled: Story = { render: () => <Example disabled /> }
