import { z } from 'zod'
import { createProjectSchema } from './create-project.schema'

export const updateProjectSchema = createProjectSchema.partial()

export type UpdateProject = z.infer<typeof updateProjectSchema>
