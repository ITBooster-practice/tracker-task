import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'

import {
	parseSidebarOpen,
	readSidebarCookie,
} from '@/widgets/main-layout/model/sidebar/preference'
import { SidebarStoreContext } from '@/widgets/main-layout/model/sidebar/provider'
import { createSideBarStore } from '@/widgets/main-layout/model/sidebar/store'

export function renderWithSidebar(
	ui: ReactNode,
	{
		sidebarStore,
		...options
	}: RenderOptions & { sidebarStore?: ReturnType<typeof createSideBarStore> } = {},
): RenderResult {
	const store = sidebarStore ?? createSideBarStore(parseSidebarOpen(readSidebarCookie()))
	const Wrapper = options.wrapper
	return render(ui, {
		...options,
		wrapper: ({ children }) => (
			<SidebarStoreContext.Provider value={store}>
				{Wrapper ? <Wrapper>{children}</Wrapper> : children}
			</SidebarStoreContext.Provider>
		),
	})
}
