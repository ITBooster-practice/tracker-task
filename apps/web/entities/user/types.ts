export type User = {
	id: string
	name: string | null
	email: string
}

type UserStoreState = {
	user: User | null
}

type UserStoreActions = {
	setUser: (user: User) => void
	clearUser: () => void
}

export type UserStore = UserStoreState & UserStoreActions
