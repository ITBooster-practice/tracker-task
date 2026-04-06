import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { renderToString } from 'react-dom/server'
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

	it('до монтирования (SSR) возвращает undefined', () => {
		let captured: number | undefined

		const TestComponent = () => {
			captured = useHydratedStore(useTestStore, (state) => state.count)
			return null
		}

		renderToString(React.createElement(TestComponent))

		expect(captured).toBeUndefined()
	})

	it('после монтирования возвращает актуальное значение из Zustand store', async () => {
		const { result } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.count),
		)

		await waitFor(() => {
			expect(result.current).toBe(42)
		})
	})

	it('после монтирования selector возвращает актуальное поле из store', async () => {
		const { result } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.name),
		)

		await waitFor(() => {
			expect(result.current).toBe('test')
		})
	})

	it('при изменении store реактивно обновляется', async () => {
		const { result } = renderHook(() =>
			useHydratedStore(useTestStore, (state) => state.count),
		)

		await waitFor(() => {
			expect(result.current).toBe(42)
		})

		act(() => {
			useTestStore.getState().increment()
		})

		await waitFor(() => {
			expect(result.current).toBe(43)
		})
	})
})
