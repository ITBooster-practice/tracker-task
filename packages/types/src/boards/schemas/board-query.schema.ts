import { z } from 'zod'

export const boardQuerySchema = z.object({ boardId: z.string().trim().min(1) }).strict()

export type BoardQuery = z.infer<typeof boardQuerySchema>
