import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'

import { ROUTES } from '@/shared/config/routes'

import { isApiError } from '../api/utils'
import { getDevelopmentSnapshot, hasFeature } from './feature-flags'
import { featureFlagsService } from './feature-flags-service'

export const getServerFeatureSnapshot = cache(async () => {
	try {
		return await featureFlagsService.snapshot()
	} catch (error) {
		if (isApiError(error) && error.statusCode === 401) redirect(ROUTES.login)
		const local = getDevelopmentSnapshot()
		if (local) return local
		throw error
	}
})
export async function requireServerFeature(key: string): Promise<void> {
	if (!hasFeature(await getServerFeatureSnapshot(), key)) notFound()
}
