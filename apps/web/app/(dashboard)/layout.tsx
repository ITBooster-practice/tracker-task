import { ProtectedRouteGuard } from '@/lib/session/protected-route-guard'
import { MainLayout } from '@/widgets/main-layout'

interface Props {
	children: React.ReactNode
	modal: React.ReactNode
}

export default function DashboardLayout({ children, modal }: Props) {
	return (
		<ProtectedRouteGuard>
			<MainLayout>{children}</MainLayout>
			{modal}
		</ProtectedRouteGuard>
	)
}
