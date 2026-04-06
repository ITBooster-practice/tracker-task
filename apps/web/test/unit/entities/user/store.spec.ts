import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from '@/entities/user'

const mockUser = { id: '1', name: 'Alex', email: 'alex@gmail.eu' }

describe('useUserStore', () => {
	beforeEach(() => useUserStore.getState().clearUser())

	it('начальное состояние → user: null', () => {
		expect(useUserStore.getState().user).toBeNull()
	})

	it('setUser({ id, name, email }) → user = объект', () => {
		useUserStore.getState().setUser(mockUser)

		expect(useUserStore.getState().user).toStrictEqual(mockUser)
	})

	it('clearUser() → user = null', () => {
		useUserStore.getState().setUser(mockUser)

		useUserStore.getState().clearUser()

		expect(useUserStore.getState().user).toBeNull()
	})

	it("persist: ключ хранилища 'user-storage'", () => {
		expect(useUserStore.persist.getOptions().name).toBe('user-storage')
	})
})
