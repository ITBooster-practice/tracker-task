import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useEditProjectForm } from '@/views/projects/model/use-edit-project-form'

describe('useEditProjectForm', () => {
	it('инициализируется с переданными значениями', () => {
		const { result } = renderHook(() => useEditProjectForm('My Project', 'Описание'))

		expect(result.current.name).toBe('My Project')
		expect(result.current.description).toBe('Описание')
	})

	it('isValid=false когда имя пустое', () => {
		const { result } = renderHook(() => useEditProjectForm('', ''))

		expect(result.current.isValid).toBe(false)
	})

	it('isValid=true когда имя заполнено', () => {
		const { result } = renderHook(() => useEditProjectForm('My Project', ''))

		expect(result.current.isValid).toBe(true)
	})

	it('isValid=false когда имя состоит только из пробелов', () => {
		const { result } = renderHook(() => useEditProjectForm('   ', ''))

		expect(result.current.isValid).toBe(false)
	})

	it('setName обновляет имя', () => {
		const { result } = renderHook(() => useEditProjectForm('Old', ''))

		act(() => result.current.setName('New'))

		expect(result.current.name).toBe('New')
	})

	it('getData возвращает trimmed значения', () => {
		const { result } = renderHook(() =>
			useEditProjectForm('  My Project  ', '  Описание  '),
		)

		expect(result.current.getData()).toEqual({
			name: 'My Project',
			description: 'Описание',
		})
	})

	it('getData возвращает undefined для пустого описания', () => {
		const { result } = renderHook(() => useEditProjectForm('My Project', ''))

		expect(result.current.getData()).toEqual({
			name: 'My Project',
			description: undefined,
		})
	})

	it('синхронизируется при изменении начальных значений', () => {
		const { result, rerender } = renderHook(
			({ name, desc }: { name: string; desc: string }) => useEditProjectForm(name, desc),
			{ initialProps: { name: 'Old', desc: 'Old desc' } },
		)

		rerender({ name: 'New', desc: 'New desc' })

		expect(result.current.name).toBe('New')
		expect(result.current.description).toBe('New desc')
	})
})
