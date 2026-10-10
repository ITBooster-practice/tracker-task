import { useQuery } from '@tanstack/react-query'

import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

export const featureFlagsKeys = {
	all: ['feature-flags'] as const,
	snapshot: ['feature-flags', 'snapshot'] as const,
	access: ['feature-flags', 'access'] as const,
	list: ['feature-flags', 'list'] as const,
	audit: (id: string) => ['feature-flags', 'audit', id] as const,
}
export const useFeatureFlagsList = (enabled: boolean) =>
	useQuery({
		queryKey: featureFlagsKeys.list,
		queryFn: ({ signal }) => featureFlagsService.list(signal),
		enabled,
		retry: false,
	})
export const useFeatureFlagAudit = (id: string) =>
	useQuery({
		queryKey: featureFlagsKeys.audit(id),
		queryFn: () => featureFlagsService.audit(id),
		enabled: Boolean(id),
		retry: false,
	})
