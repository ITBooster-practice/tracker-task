import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLoginForm } from '@/views/auth/model/use-login-form'

describe('useLoginForm', () => {
	it('возвращает дефолтные значения полей', () => {
		const { result } = renderHook(() => useLoginForm())

		expect(result.current.getValues()).toEqual({
			email: '',
			password: '',
		})
	})

	it('форма имеет методы для работы с полями', () => {
		const { result } = renderHook(() => useLoginForm())

		expect(typeof result.current.register).toBe('function')
		expect(typeof result.current.handleSubmit).toBe('function')
		expect(typeof result.current.formState).toBe('object')
	})

	it('начальное состояние — форма чистая и не отправлялась', () => {
		const { result } = renderHook(() => useLoginForm())

		expect(result.current.formState.isDirty).toBe(false)
		expect(result.current.formState.isSubmitted).toBe(false)
	})
})
