import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	parseSidebarOpen,
	readSidebarCookie,
	writeSidebarCookie,
} from '@/widgets/main-layout/model/sidebar/preference'
import { createSideBarStore } from '@/widgets/main-layout/model/sidebar/store'

let store: ReturnType<typeof createSideBarStore>
beforeEach(() => {
	writeSidebarCookie(undefined)
	localStorage.removeItem('sidebar-state')
	store = createSideBarStore()
})
afterEach(() => {
	vi.restoreAllMocks()
	writeSidebarCookie(undefined)
	localStorage.removeItem('sidebar-state')
})

describe('sidebar persistence', () => {
	it.each([false, true])(
		'provides the saved %s state to the first server snapshot after reload',
		(isOpen) => {
			if (isOpen) store.getState().open()
			else store.getState().close()
			expect(document.cookie).toContain(`sidebar-state=${isOpen}`)
			const serverPreference = parseSidebarOpen(readSidebarCookie())
			const afterReload = createSideBarStore(serverPreference)
			expect(afterReload.getInitialState().isOpen).toBe(isOpen)
			expect(afterReload.getState().isOpen).toBe(isOpen)
		},
	)
	it('keeps independent request stores isolated', () => {
		const first = createSideBarStore(false)
		const second = createSideBarStore(true)
		expect(first.getInitialState().isOpen).toBe(false)
		expect(second.getInitialState().isOpen).toBe(true)
		first.getState().close()
		expect(second.getState().isOpen).toBe(true)
	})
	it('migrates the previous local preference without losing it', () => {
		localStorage.setItem(
			'sidebar-state',
			JSON.stringify({ state: { isOpen: false }, version: 0 }),
		)
		const restored = createSideBarStore()
		expect(restored.getState().isOpen).toBe(false)
		expect(readSidebarCookie()).toBe('false')
		expect(localStorage.getItem('sidebar-state')).toBeNull()
	})
	it('keeps working when browser persistence is blocked', () => {
		vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
			throw new Error('Blocked')
		})
		vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
			throw new Error('Blocked')
		})
		const blocked = createSideBarStore()
		expect(() => blocked.getState().close()).not.toThrow()
		expect(blocked.getState().isOpen).toBe(false)
	})
	it.each(['closed', '', 'null'])('ignores invalid cookie values: %j', (value) => {
		document.cookie = `sidebar-state=${value}; Path=/`
		expect(createSideBarStore().getState().isOpen).toBe(true)
	})
	it('supports opening, closing and toggling', () => {
		store.getState().close()
		expect(store.getState().isOpen).toBe(false)
		store.getState().open()
		expect(store.getState().isOpen).toBe(true)
		store.getState().toggle()
		expect(store.getState().isOpen).toBe(false)
	})
})
