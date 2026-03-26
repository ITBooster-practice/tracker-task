import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { create } from 'zustand'

import { useHydratedStore } from '@/shared/hooks/use-hydrated-store'

interface TestState {
	count: number
	name: string
	increment: () => void
}

const createTestStore = () =>
	create<TestState>((set) => ({
		count: 42,
		name: 'test',
		increment: () => set((s) => ({ count: s.count + 1 })),
	}))

describe('useHydratedStore', () => {
	let useTestStore: ReturnType<typeof createTestStore>

	beforeEach(() => {
		useTestStore = createTestStore()
	})

	it('возвращает значение из стора', () => {
		const { result } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.count),
		)

		expect(result.current).toBe(42)
	})

	it('применяет selector — возвращает конкретное поле, а не весь стор', () => {
		const { result } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.name),
		)

		expect(result.current).toBe('test')
	})

	it('отражает изменения стора после обновления', () => {
		const { result, rerender } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.count),
		)

		expect(result.current).toBe(42)

		useTestStore.getState().increment()

		rerender()

		expect(result.current).toBe(43)
	})
})
