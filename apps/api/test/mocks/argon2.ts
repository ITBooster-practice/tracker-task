import { vi } from 'vitest'

export const hash: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue('hashed_password')
export const verify: ReturnType<typeof vi.fn> = vi.fn()
