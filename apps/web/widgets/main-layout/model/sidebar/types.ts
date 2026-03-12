import type { LucideIcon } from '@repo/ui/icons'

type SideBarStoreState = {
	isOpen: boolean
}

type SideBarStoreActions = {
	open: () => void
	close: () => void
	toggle: () => void
}

export type SideBarStore = SideBarStoreState & SideBarStoreActions

export type SidebarNavItem = {
	title: string
	href: string
	icon: LucideIcon
	iconClassName?: string
	match?: (pathname?: string) => boolean
}

export type SidebarNavSection = {
	title: string
	items: SidebarNavItem[]
}

export type SidebarProjectItem = {
	id: string
	shortName: string
	title: string
}

export type SidebarWorkspace = {
	title: string
	subtitle: string
}

export type SidebarUserCard = {
	initials: string
	name: string
	role: string
}
