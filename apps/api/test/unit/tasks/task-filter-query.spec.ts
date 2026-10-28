import { describe, expect, it } from 'vitest'
import { taskFilterQuerySchema } from '@repo/types'

describe('Task list query contract', () => {
	it('provides explicit pagination and sorting defaults', () => {
		expect(taskFilterQuerySchema.parse({})).toEqual({
			page: 1,
			limit: 10,
			sortBy: 'createdAt',
			sortOrder: 'desc',
		})
	})

	it('parses a combined query and trims search without losing literal characters', () => {
		expect(
			taskFilterQuerySchema.parse({
				page: '2',
				limit: '5',
				type: 'BUG',
				status: 'TODO',
				priority: 'HIGH',
				assigneeId: 'member',
				search: '  100%_done  ',
				sortBy: 'priority',
				sortOrder: 'asc',
			}),
		).toEqual({
			page: 2,
			limit: 5,
			type: 'BUG',
			status: 'TODO',
			priority: 'HIGH',
			assigneeId: 'member',
			search: '100%_done',
			sortBy: 'priority',
			sortOrder: 'asc',
		})
	})

	it.each([
		{ type: 'UNKNOWN' },
		{ type: ['TASK', 'BUG'] },
		{ search: ['first', 'second'] },
		{ search: 'x'.repeat(256) },
		{ sortBy: 'title' },
		{ sortBy: ['createdAt', 'priority'] },
		{ sortOrder: 'DESC' },
		{ sortOrder: ['asc', 'desc'] },
	])('rejects invalid list parameters: %j', (query) => {
		expect(taskFilterQuerySchema.safeParse(query).success).toBe(false)
	})
})
