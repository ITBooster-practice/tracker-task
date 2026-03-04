import { vi } from 'vitest'

export const hash = vi.fn().mockResolvedValue('hashed_password')
export const verify = vi.fn()
