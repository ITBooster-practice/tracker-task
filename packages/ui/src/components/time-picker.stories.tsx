import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimePicker, type TimePickerProps } from './time-picker'
function Example(props: TimePickerProps) {
	const [value, setValue] = useState(props.value)
	return (
		<div className='w-64'>
			<TimePicker {...props} value={value} onChange={setValue} />
		</div>
	)
}
const meta = {
	title: 'Shared/UI/TimePicker',
	component: TimePicker,
	tags: ['autodocs'],
	render: (args) => <Example {...args} />,
	args: { value: '14:30', onChange: () => {} },
} satisfies Meta<typeof TimePicker>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Minimum: Story = { args: { value: '12:35', min: '12:35', max: '18:00' } }
export const Disabled: Story = { args: { disabled: true } }
