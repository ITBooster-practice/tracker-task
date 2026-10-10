import { FeatureFlagsPageView } from '@/views/feature-flags'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

export default async function FeatureFlagsPage() {
	const access = await featureFlagsService.access()
	if (!access.canManage)
		return (
			<section className='p-6' role='alert'>
				<h1 className='text-xl font-semibold'>Доступ запрещён</h1>
				<p>Управление флагами доступно только разработчику системы.</p>
			</section>
		)
	return <FeatureFlagsPageView />
}
