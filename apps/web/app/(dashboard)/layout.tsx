import { authKeys } from '@/hooks/api/use-auth'
import { authService } from '@/lib/api/auth-service'
import { isApiError } from '@/lib/api/utils'
import { getQueryClient } from '@/lib/query-client'
import { ROUTES } from '@/shared/config/routes'
import { MainLayout } from '@/widgets/main-layout'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

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
	} catch (error) {
		if (isApiError(error) && error.statusCode === 401) {
			redirect(ROUTES.login)
		}

		throw error
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<MainLayout>{children}</MainLayout>
			{modal}
		</HydrationBoundary>
	)
}
