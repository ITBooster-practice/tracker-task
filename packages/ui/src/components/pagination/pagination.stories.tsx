import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { usePagination } from '../../hooks/use-pagination'
import { Pagination, type PaginationMeta } from './pagination'

// Тип совместим с PaginatedResponse<T> из apps/web/shared/lib/api/types.ts
interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}

const meta = {
	title: 'Shared/UI/Pagination',
	component: Pagination,
	tags: ['autodocs'],
	argTypes: {
		onPageChange: { action: 'onPageChange' },
	},
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {
	args: {
		meta: { page: 1, limit: 10, total: 100, totalPages: 10 },
	},
}

export const MiddlePage: Story = {
	args: {
		meta: { page: 5, limit: 10, total: 100, totalPages: 10 },
	},
}

export const LastPage: Story = {
	args: {
		meta: { page: 10, limit: 10, total: 100, totalPages: 10 },
	},
}

export const FewPages: Story = {
	args: {
		meta: { page: 2, limit: 10, total: 30, totalPages: 3 },
	},
}

export const OnePage: Story = {
	args: {
		meta: { page: 1, limit: 10, total: 5, totalPages: 1 },
	},
}

export const Interactive: Story = {
	render: () => {
		const [page, setPage] = useState(1)

		return (
			<div className='flex flex-col items-start gap-4'>
				<p className='text-sm text-muted-foreground'>Текущая страница: {page}</p>
				<Pagination
					meta={{ page, limit: 10, total: 200, totalPages: 20 }}
					onPageChange={setPage}
				/>
			</div>
		)
	},
}

/**
 * Демонстрация паттерна с usePagination + PaginatedResponse<T>.
 *
 * В реальном приложении `response` приходит из API-запроса:
 * ```ts
 * const { paginationParams, setPage } = usePagination()
 * const { data } = useQuery({ queryFn: () => api.tasks.list(paginationParams) })
 * // data имеет тип PaginatedResponse<Task>
 * return <Pagination meta={data.meta} onPageChange={setPage} />
 * ```
 */
export const WithPaginatedResponse: Story = {
	render: () => {
		const { paginationParams, setPage } = usePagination({ initialLimit: 5 })

		// Имитация PaginatedResponse<T> — в реальности приходит из API
		const totalItems = 47
		const totalPages = Math.ceil(totalItems / paginationParams.limit)
		const response: PaginatedResponse<{ id: number; name: string }> = {
			data: Array.from({ length: paginationParams.limit }, (_, i) => ({
				id: (paginationParams.page - 1) * paginationParams.limit + i + 1,
				name: `Элемент #${(paginationParams.page - 1) * paginationParams.limit + i + 1}`,
			})).filter((item) => item.id <= totalItems),
			meta: {
				page: paginationParams.page,
				limit: paginationParams.limit,
				total: totalItems,
				totalPages,
			},
		}

		return (
			<div className='flex flex-col gap-4'>
				<ul className='space-y-1 text-sm'>
					{response.data.map((item) => (
						<li key={item.id} className='text-muted-foreground'>
							{item.name}
						</li>
					))}
				</ul>
				<p className='text-xs text-muted-foreground'>
					Показано {response.data.length} из {response.meta.total} · Страница{' '}
					{response.meta.page} / {response.meta.totalPages}
				</p>
				<Pagination meta={response.meta} onPageChange={setPage} />
			</div>
		)
	},
}
