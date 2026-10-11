import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from './calendar'

const today = new Date(2026, 9, 11)
function Example({ selected }: { selected: Date }) {
	const [day, setDay] = useState<Date | undefined>(selected)
	return (
		<Calendar
			mode='single'
			today={today}
			defaultMonth={today}
			selected={day}
			onSelect={setDay}
		/>
	)
}
const meta = {
	title: 'Shared/UI/Calendar',
	component: Calendar,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Сегодняшняя дата отмечена обводкой без фона. Если она выбрана, используется обычная заливка выбранного дня.',
			},
		},
	},
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>
export const TodayOutlined: Story = {
	render: () => <Example selected={new Date(2026, 9, 17)} />,
}
export const TodaySelected: Story = { render: () => <Example selected={today} /> }
