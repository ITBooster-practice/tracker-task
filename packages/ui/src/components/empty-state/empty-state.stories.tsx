import type { Meta, StoryObj } from '@storybook/react-vite'

import { EmptyState } from './empty-state'

const meta: Meta<typeof EmptyState> = {
	title: 'Shared/UI/EmptyState',
	component: EmptyState,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className='flex min-h-[420px] items-center justify-center bg-slate-950 p-6'>
				<Story />
			</div>
		),
	],
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const NotFound: Story = {
	args: {
		icon: '404',
		title: 'Страница не найдена',
		description: 'Проверьте адрес страницы или вернитесь на главную.',
		actionLabel: 'На главную',
	},
}

export const ErrorState: Story = {
	args: {
		icon: '!',
		title: 'Что-то пошло не так',
		description: 'Произошла ошибка. Попробуйте обновить страницу.',
		actionLabel: 'Попробовать снова',
	},
}
