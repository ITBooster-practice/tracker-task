import { MainLayout } from '@/widgets/main-layout'

interface Props {
	children: React.ReactNode
	modal: React.ReactNode
}

export default function DashboardLayout({ children, modal }: Props) {
	return (
		<>
			<MainLayout>{children}</MainLayout>
			{modal}
		</>
	)
}
