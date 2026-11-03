import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from '../skeleton'
import { CardSkeleton } from './card-skeleton'

const meta = {
	title: 'Shared/UI/CardSkeleton',
	component: CardSkeleton,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className='w-80 max-w-full'>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof CardSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const CustomContent: Story = {
	args: { className: 'h-[150px] justify-start gap-2.5 p-3.5' },
	render: (args) => (
		<CardSkeleton {...args}>
			<Skeleton className='h-3 w-16 bg-muted motion-reduce:animate-none' />
			<Skeleton className='h-3 w-full bg-muted motion-reduce:animate-none' />
			<Skeleton className='h-3 w-3/5 bg-muted motion-reduce:animate-none' />
			<div className='mt-auto flex items-center justify-between'>
				<Skeleton className='h-2.5 w-14 bg-muted motion-reduce:animate-none' />
				<Skeleton className='size-5 rounded-full bg-muted motion-reduce:animate-none' />
			</div>
		</CardSkeleton>
	),
}
