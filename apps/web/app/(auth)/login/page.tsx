import { Suspense } from 'react'

import { LoginPageView } from '@/views/auth'

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginPageView />
		</Suspense>
	)
}
