import { FeatureFlagsAccessDenied, FeatureFlagsPageView } from '@/views/feature-flags'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

export default async function FeatureFlagsPage() {
	const access = await featureFlagsService.access()
	if (!access.canManage) return <FeatureFlagsAccessDenied />
	return <FeatureFlagsPageView />
}
