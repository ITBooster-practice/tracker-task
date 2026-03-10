import { z } from 'zod'
import { createTeamSchema } from './create-team.schema'

export const updateTeamSchema = createTeamSchema.partial()

export type UpdateTeam = z.infer<typeof updateTeamSchema>
