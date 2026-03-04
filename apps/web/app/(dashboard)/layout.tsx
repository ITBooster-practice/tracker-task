import { MainLayout } from '@/widgets/main-layout'

interface Props {
	children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
	return <MainLayout>{children}</MainLayout>
}
