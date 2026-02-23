import type { Meta, StoryObj } from '@storybook/react-vite'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	CardAction,
} from './card'
import { Button } from './button'

const meta = {
	title: 'Shared/UI/Card',
	component: Card,
	tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '400px' }}>
				<Story />
			</div>
		),
	],
	render: (args) => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Create project</CardTitle>
				<CardDescription>Deploy your new project in one-click.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card Content goes here.</p>
			</CardContent>
			<CardFooter className='flex justify-between'>
				<span>Cancel</span>
				<span>Deploy</span>
			</CardFooter>
		</Card>
	),
}

export const WithActions: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '400px' }}>
				<Story />
			</div>
		),
	],
	render: (args) => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Create project</CardTitle>
				<CardDescription>Deploy your new project in one-click.</CardDescription>
				<CardAction>
					<Button variant='outline' size='sm'>
						Edit
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<p>Card Content goes here.</p>
			</CardContent>
			<CardFooter className='flex justify-between'>
				<span>Cancel</span>
				<span>Deploy</span>
			</CardFooter>
		</Card>
	),
}
