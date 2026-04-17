import { notFound, redirect } from 'next/navigation'

import { FEATURES, ROUTES } from '@/shared/config'

export default function LegacyBoardsRedirectPage() {
	if (!FEATURES.BOARDS) {
		notFound()
	}

	redirect(ROUTES.boards)
}
