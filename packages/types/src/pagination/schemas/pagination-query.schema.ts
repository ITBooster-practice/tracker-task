import { z } from 'zod'

import {
	DEFAULT_LIMIT,
	DEFAULT_PAGE,
	MAX_LIMIT,
	MIN_LIMIT,
	MIN_PAGE,
} from '../constants/pagination.constants'

export const paginationQuerySchema = z.object({
	page: z.coerce
		.number({ message: 'Номер страницы должен быть числом' })
		.int({ message: 'Номер страницы должен быть целым числом' })
		.min(MIN_PAGE, { message: 'Номер страницы должен быть не меньше 1' })
		.default(DEFAULT_PAGE),
	limit: z.coerce
		.number({ message: 'Лимит должен быть числом' })
		.int({ message: 'Лимит должен быть целым числом' })
		.min(MIN_LIMIT, { message: 'Лимит должен быть не меньше 1' })
		.max(MAX_LIMIT, { message: `Лимит должен быть не больше ${MAX_LIMIT}` })
		.default(DEFAULT_LIMIT),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
