import { ProtectedRouteGuard } from '@/lib/session/protected-route-guard'
import { SessionProvider } from '@/lib/session/session-provider'
import { MainLayout } from '@/widgets/main-layout'

interface Props {
	children: React.ReactNode
	modal: React.ReactNode
}

export default function DashboardLayout({ children, modal }: Props) {
	return (
		<SessionProvider>
			<ProtectedRouteGuard>
				<MainLayout>{children}</MainLayout>
				{modal}
			</ProtectedRouteGuard>
		</SessionProvider>
	)
}
