import type { MockInstance } from 'vitest'

type TestProcedure = (...args: unknown[]) => unknown

export type TestMock = MockInstance<TestProcedure> & TestProcedure
