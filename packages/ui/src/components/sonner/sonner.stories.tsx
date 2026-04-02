import {
	Title,
	Subtitle,
	Description,
	Canvas,
	Controls,
} from '@storybook/addon-docs/blocks'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button'
import { Toaster, toast } from './sonner'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastDemoProps {
	type: ToastType
}

function ToastDemo({ type }: ToastDemoProps) {
	const handleClick = () => {
		toast[type]('Пример уведомления', { description: 'Дополнительное описание' })
	}

	return (
		<>
			<Button onClick={handleClick}>Показать toast</Button>
		</>
	)
}

function CustomDocsPage() {
	return (
		<>
			<Title />
			<Subtitle />
			<Description />
			<Canvas />
			<Controls />
			<Toaster />
		</>
	)
}

const meta: Meta<typeof ToastDemo> = {
	title: 'Shared/UI/Toast',
	component: ToastDemo,
	tags: ['autodocs'],
	parameters: {
		docs: {
			page: CustomDocsPage,
		},
	},
	argTypes: {
		type: {
			control: 'select',
			options: ['success', 'error', 'warning', 'info'] satisfies ToastType[],
		},
	},
	args: {
		type: 'success',
	},
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	tags: ['!dev'],
}
