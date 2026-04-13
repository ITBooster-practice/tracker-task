import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from './skeleton'

const meta = {
	title: 'Shared/UI/Skeleton',
	component: Skeleton,
	tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/** Строки текста — заголовок + параграф */
export const TextLines: Story = {
	render: () => (
		<div className='flex flex-col gap-3'>
			<Skeleton className='h-6 w-48' />
			<div className='flex flex-col gap-2'>
				<Skeleton className='h-4 w-full' />
				<Skeleton className='h-4 w-4/5' />
				<Skeleton className='h-4 w-3/5' />
			</div>
		</div>
	),
}

/** Аватар с именем */
export const Avatar: Story = {
	render: () => (
		<div className='flex items-center gap-3'>
			<Skeleton className='size-10 rounded-full' />
			<div className='flex flex-col gap-1.5'>
				<Skeleton className='h-4 w-32' />
				<Skeleton className='h-3 w-20' />
			</div>
		</div>
	),
}

/** Кнопки и бейджи */
export const Controls: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-2'>
			<Skeleton className='h-9 w-28 rounded-[var(--radius-control)]' />
			<Skeleton className='h-9 w-9 rounded-[var(--radius-control)]' />
			<Skeleton className='h-5 w-16 rounded-full' />
			<Skeleton className='h-5 w-20 rounded-full' />
		</div>
	),
}

/** Сетка карточек */
export const CardGrid: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '760px' }}>
				<Story />
			</div>
		),
	],
	render: () => (
		<div className='grid grid-cols-2 gap-4'>
			{Array.from({ length: 4 }).map((_, i) => (
				<div
					key={i}
					className='flex h-[184px] w-full flex-col justify-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card p-5'
				>
					<div className='flex items-start justify-between'>
						<Skeleton className='size-8 rounded-[calc(var(--radius-control)-2px)]' />
						<Skeleton className='size-4' />
					</div>
					<div className='space-y-1.5'>
						<Skeleton className='h-5 w-2/5' />
						<div className='flex items-center gap-4'>
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-4 w-20' />
						</div>
					</div>
					<div className='flex items-center -space-x-2'>
						{Array.from({ length: 4 }).map((_, j) => (
							<Skeleton key={j} className='size-6 rounded-full border-2 border-card' />
						))}
					</div>
				</div>
			))}
		</div>
	),
}

/** Список строк */
export const RowList: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: '600px' }}>
				<Story />
			</div>
		),
	],
	render: () => (
		<div className='rounded-[var(--radius-surface)] border border-border bg-card'>
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className='flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0'
				>
					<Skeleton className='h-4 w-14 shrink-0' />
					<Skeleton className='h-4 flex-1' />
					<Skeleton className='size-8 shrink-0 rounded-full' />
				</div>
			))}
		</div>
	),
}
