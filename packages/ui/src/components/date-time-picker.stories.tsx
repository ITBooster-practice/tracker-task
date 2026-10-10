import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateTimePicker, type DateTimePickerProps } from './date-time-picker'

function Example(props: DateTimePickerProps) {
	const [value, setValue] = useState(props.value)
	return (
		<div className='grid w-full max-w-sm gap-4'>
			<DateTimePicker {...props} value={value} onChange={setValue} />
			<output className='text-sm text-muted-foreground'>
				{value || 'Дата не выбрана'}
			</output>
		</div>
	)
}
const meta = {
	title: 'Shared/UI/DateTimePicker',
	component: DateTimePicker,
	tags: ['autodocs'],
	render: (args) => <Example {...args} />,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Календарь с селектами месяца и года, ввод ДД.ММ.ГГГГ с клавиатуры. withTime добавляет ввод ЧЧ:ММ и shadcn Select часов/минут. Значение локальное, границы — Date. referenceDate позволяет использовать часы сервера.',
			},
		},
	},
	args: { value: '', onChange: () => {}, label: 'Дата завершения' },
} satisfies Meta<typeof DateTimePicker>
export default meta
type Story = StoryObj<typeof meta>
export const DateOnly: Story = {}
export const DateAndTime: Story = { args: { withTime: true, value: '2028-10-10T14:30' } }
const serverTime = new Date(2026, 9, 10, 12, 34, 30)
export const ServerMinimum: Story = {
	args: {
		withTime: true,
		referenceDate: serverTime,
		minValue: serverTime,
		value: '2026-10-10T12:35',
		description:
			'Минимум взят с сервера: 10.10.2026 12:34:30. Доступное время — с 12:35.',
	},
}
export const BoundedDates: Story = {
	args: {
		minValue: new Date(2026, 9, 10),
		maxValue: new Date(2028, 9, 10),
		referenceDate: serverTime,
	},
}
export const Disabled: Story = {
	args: { disabled: true, withTime: true, value: '2028-10-10T14:30' },
}
