import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

import { MainLayout } from '@/widgets/main-layout'
import { FeatureFlagsProvider } from '@/features/feature-flags'
import { authKeys } from '@/shared/api/use-auth'
import { featureFlagsKeys } from '@/shared/api/use-feature-flags'
import { ROUTES } from '@/shared/config'
import { authService } from '@/shared/lib/api/auth-service'
import { isApiError } from '@/shared/lib/api/utils'
import { getServerFeatureSnapshot } from '@/shared/lib/feature-flags/server'
import { getQueryClient } from '@/shared/lib/query-client'

interface Props {
	children: React.ReactNode
	modal: React.ReactNode
}

export default async function DashboardLayout({ children, modal }: Props) {
	const queryClient = getQueryClient()

	try {
		await queryClient.prefetchQuery({
			queryKey: authKeys.getMe,
			queryFn: authService.getMe,
		})
		await queryClient.prefetchQuery({
			queryKey: featureFlagsKeys.snapshot,
			queryFn: getServerFeatureSnapshot,
		})
	} catch (error) {
		if (isApiError(error) && error.statusCode === 401) {
			redirect(ROUTES.login)
		}

		throw error
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FeatureFlagsProvider>
				<MainLayout>{children}</MainLayout>
				{modal}
			</FeatureFlagsProvider>
		</HydrationBoundary>
	)
}
