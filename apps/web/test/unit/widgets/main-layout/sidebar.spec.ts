import { beforeEach, describe, expect, it } from 'vitest'

import { useSideBarStore } from '@/widgets/main-layout/model/sidebar'

describe('useSideBarStore', () => {
	beforeEach(() => useSideBarStore.setState({ isOpen: true }))

	it('open() → isOpen = true', () => {
		useSideBarStore.getState().close()

		useSideBarStore.getState().open()

		expect(useSideBarStore.getState().isOpen).toBe(true)
	})

	it('close() → isOpen = false', () => {
		useSideBarStore.getState().close()

		expect(useSideBarStore.getState().isOpen).toBe(false)
	})

	it('toggle() при true → false', () => {
		useSideBarStore.getState().toggle()

		expect(useSideBarStore.getState().isOpen).toBe(false)
	})

	it('toggle() при false → true', () => {
		useSideBarStore.getState().close()

		useSideBarStore.getState().toggle()

		expect(useSideBarStore.getState().isOpen).toBe(true)
	})
})
