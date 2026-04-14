import { Suspense } from 'react'

import { RegisterPageView } from '@/views/auth'

export default function RegisterPage() {
	return (
		<Suspense fallback={null}>
			<RegisterPageView />
		</Suspense>
	)
}
