import { z } from 'zod'

export const archiveBoardSchema = z
	.object({
		expectedUpdatedAt: z.iso.datetime({ offset: true }),
	})
	.strict()

export type ArchiveBoard = z.infer<typeof archiveBoardSchema>
