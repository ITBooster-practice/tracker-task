import type { FeatureFlag } from '@repo/types'
import { Badge, cn } from '@repo/ui'

export function FeatureFlagStatus({
	flag,
}: {
	flag: Pick<FeatureFlag, 'enabled' | 'archivedAt'>
}) {
	const status = flag.archivedAt ? 'archived' : flag.enabled ? 'enabled' : 'disabled'
	const styles = {
		enabled: {
			label: 'Включён',
			badge:
				'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
			dot: 'bg-emerald-500',
		},
		disabled: {
			label: 'Отключён',
			badge: 'border-border bg-muted/50 text-muted-foreground',
			dot: 'bg-slate-400',
		},
		archived: {
			label: 'Архивирован',
			badge: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
			dot: 'bg-amber-500',
		},
	}[status]

	return (
		<Badge variant='outline' className={cn('gap-2 px-2.5 py-1', styles.badge)}>
			<span aria-hidden='true' className={cn('size-1.5 rounded-full', styles.dot)} />
			{styles.label}
		</Badge>
	)
}
