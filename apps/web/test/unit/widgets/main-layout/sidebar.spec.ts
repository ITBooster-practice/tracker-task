import { beforeEach, describe, expect, it } from 'vitest'

import { useSideBarStore } from '@/widgets/main-layout/model/sidebar'

describe('useSideBarStore', () => {
	beforeEach(() => useSideBarStore.setState({ isOpen: true }))

	it('дефолтное значение', () => {
		expect(useSideBarStore.getState().isOpen).toBe(true)
	})

	it('open после close', () => {
		useSideBarStore.getState().close()

		useSideBarStore.getState().open()

		expect(useSideBarStore.getState().isOpen).toBe(true)
	})

	it('закрыть', () => {
		useSideBarStore.getState().close()

		expect(useSideBarStore.getState().isOpen).toBe(false)
	})

	it('toggle: true', () => {
		useSideBarStore.getState().toggle()

		expect(useSideBarStore.getState().isOpen).toBe(false)
	})

	it('toggle: false', () => {
		useSideBarStore.getState().close()

		useSideBarStore.getState().toggle()

		expect(useSideBarStore.getState().isOpen).toBe(true)
	})
})
