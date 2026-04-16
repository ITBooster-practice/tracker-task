import { describe, expect, it } from 'vitest'

import {
	buildPaginatedResponse,
	buildPaginationMeta,
	getPaginationPrismaParams,
} from '../../../src/utils/pagination.util'

describe('pagination.util', () => {
	describe('getPaginationPrismaParams', () => {
		it('возвращает skip 0 и take limit для первой страницы', () => {
			expect(getPaginationPrismaParams({ page: 1, limit: 10 })).toEqual({
				skip: 0,
				take: 10,
			})
		})

		it('возвращает корректный skip для произвольной страницы', () => {
			expect(getPaginationPrismaParams({ page: 3, limit: 5 })).toEqual({
				skip: 10,
				take: 5,
			})
		})
	})

	describe('buildPaginationMeta', () => {
		it('возвращает totalPages 0 для пустого результата', () => {
			expect(buildPaginationMeta({ page: 1, limit: 10 }, 0)).toEqual({
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
			})
		})

		it('возвращает корректное количество страниц для непустого результата', () => {
			expect(buildPaginationMeta({ page: 2, limit: 10 }, 21)).toEqual({
				page: 2,
				limit: 10,
				total: 21,
				totalPages: 3,
			})
		})
	})

	describe('buildPaginatedResponse', () => {
		it('собирает data и meta в единый ответ', () => {
			expect(buildPaginatedResponse([{ id: '1' }], { page: 2, limit: 1 }, 3)).toEqual({
				data: [{ id: '1' }],
				meta: {
					page: 2,
					limit: 1,
					total: 3,
					totalPages: 3,
				},
			})
		})
	})
})
