import type { Meta, StoryObj } from '@storybook/react-vite'

import { EmptyState } from './empty-state'

const meta: Meta<typeof EmptyState> = {
	title: 'Shared/UI/EmptyState',
	component: EmptyState,
	tags: ['autodocs'],
	argTypes: {
		headingLevel: { control: 'select', options: ['h1', 'h2'] },
	},
	decorators: [
		(Story) => (
			<div className='flex min-h-[420px] items-center justify-center bg-background p-6 text-foreground'>
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

export const ContentSection: Story = {
	args: {
		title: 'Ничего не найдено',
		description: 'Измените условия поиска.',
		headingLevel: 'h2',
	},
}
