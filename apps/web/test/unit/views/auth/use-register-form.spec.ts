import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRegisterForm } from '@/views/auth/model/use-register-form'

describe('useRegisterForm', () => {
	it('возвращает дефолтные значения всех полей', () => {
		const { result } = renderHook(() => useRegisterForm())

		expect(result.current.getValues()).toEqual({
			email: '',
			password: '',
			confirmPassword: '',
			name: '',
		})
	})

	it('форма имеет методы для работы с полями', () => {
		const { result } = renderHook(() => useRegisterForm())

		expect(typeof result.current.register).toBe('function')
		expect(typeof result.current.handleSubmit).toBe('function')
		expect(typeof result.current.formState).toBe('object')
	})

	it('начальное состояние — форма чистая и не отправлялась', () => {
		const { result } = renderHook(() => useRegisterForm())

		expect(result.current.formState.isDirty).toBe(false)
		expect(result.current.formState.isSubmitted).toBe(false)
	})
})
