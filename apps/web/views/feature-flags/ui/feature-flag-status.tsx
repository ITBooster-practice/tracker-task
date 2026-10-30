import type { FeatureFlag } from '@repo/types'
import { Badge, cn } from '@repo/ui'

export function FeatureFlagStatus({ flag }: { flag: Pick<FeatureFlag, 'enabled'> }) {
	return (
		<Badge
			variant='outline'
			className={
				flag.enabled
					? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
					: 'border-border bg-muted/50 text-muted-foreground'
			}
		>
			<span
				aria-hidden='true'
				className={cn(
					'size-1.5 rounded-full',
					flag.enabled ? 'bg-emerald-500' : 'bg-slate-400',
				)}
			/>
			{flag.enabled ? 'Включён' : 'Отключён'}
		</Badge>
	)
}
