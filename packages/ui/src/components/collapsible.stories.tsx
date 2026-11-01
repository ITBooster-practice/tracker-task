import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { Input } from './input'

const meta = {
	title: 'Shared/UI/Collapsible',
	component: Collapsible,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
	render: () => (
		<Collapsible className='w-full max-w-sm space-y-2'>
			<CollapsibleTrigger asChild>
				<Button variant='outline'>Показать варианты</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className='rounded-[var(--radius-control)] border p-4 text-sm'>
					Дополнительные варианты плавно занимают место в форме.
				</div>
			</CollapsibleContent>
		</Collapsible>
	),
} satisfies Meta<typeof Collapsible>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Horizontal: Story = {
	render: () => (
		<Collapsible className='w-full max-w-sm space-y-2'>
			<CollapsibleTrigger asChild>
				<Button variant='outline'>Показать действие справа</Button>
			</CollapsibleTrigger>
			<div className='flex min-w-0 items-center'>
				<Input
					aria-label='Значение'
					placeholder='Поле плавно освобождает место'
					className='min-w-0 flex-1'
				/>
				<CollapsibleContent orientation='horizontal' className='shrink-0'>
					<div className='pl-2'>
						<Button variant='ghost' size='default' className='w-max'>
							Очистить
						</Button>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	),
}
