import type { MockInstance } from 'vitest'

type AnyTestFunction = (...args: any[]) => any

export type TestMock = MockInstance<AnyTestFunction> & AnyTestFunction
