type SideBarStoreState = {
	isOpen: boolean
}

type SideBarStoreActions = {
	open: () => void
	close: () => void
	toggle: () => void
}

export type SideBarStore = SideBarStoreState & SideBarStoreActions
