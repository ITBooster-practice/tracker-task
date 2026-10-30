export type User = {
	id: string
	name: string | null
	email: string
}

type UserStoreState = {
	user: User | null
	sessionVersion: number
	sessionEnded: boolean
}

type UserStoreActions = {
	setUser: (user: User) => void
	clearUser: () => void
	startSession: () => void
}

export type UserStore = UserStoreState & UserStoreActions
