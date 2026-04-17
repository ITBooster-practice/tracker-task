import { notFound } from 'next/navigation'

import { BoardsPageView } from '@/views/boards'
import { FEATURES } from '@/shared/config'

export default function BoardsPage() {
	if (!FEATURES.BOARDS) {
		notFound()
	}

	return <BoardsPageView />
}
