import { redirect } from 'next/navigation'

import { FEATURE_KEYS } from '@repo/types'

import { ROUTES } from '@/shared/config/routes'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function LegacyBoardsRedirectPage() {
	await requireServerFeature(FEATURE_KEYS.BOARDS)
	redirect(ROUTES.boards)
}
