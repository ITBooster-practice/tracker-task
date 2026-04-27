export interface Project {
	id: string
	name: string
	description: string | null
	teamId: string
	createdById: string
	createdAt: string
	updatedAt: string
}

export interface CreateProjectBody {
	name: string
	description?: string
}

export interface UpdateProjectBody {
	name?: string
	description?: string
}
