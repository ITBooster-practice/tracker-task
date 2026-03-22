import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from '@/entities/user'

const mockUser = { id: '1', name: 'Alex', email: 'alex@gmail.eu' }

describe('useUserStore', () => {
	beforeEach(() => useUserStore.getState().clearUser())

	it('дефолтное значение', () => {
		expect(useUserStore.getState().user).toBeNull()
	})

	it('setUser меняет юзера', () => {
		useUserStore.getState().setUser(mockUser)

		expect(useUserStore.getState().user).toStrictEqual(mockUser)
	})

	it('clearUser очищает юзера', () => {
		useUserStore.getState().setUser(mockUser)

		useUserStore.getState().clearUser()

		expect(useUserStore.getState().user).toBeNull()
	})
})
