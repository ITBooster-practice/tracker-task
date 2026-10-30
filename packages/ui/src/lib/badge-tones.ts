import { cva, type VariantProps } from 'class-variance-authority'

const badgeToneVariants = cva('', {
	variants: {
		tone: {
			owner:
				'border-amber-300 bg-amber-100/80 text-amber-900 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-300',
			admin:
				'border-sky-200 bg-sky-50 text-sky-700 dark:border-primary/15 dark:bg-primary/10 dark:text-primary',
			member:
				'border-slate-200 bg-slate-50 text-slate-700 dark:border-border/60 dark:bg-surface-2 dark:text-muted-foreground',
		},
	},
})

type BadgeTone = NonNullable<VariantProps<typeof badgeToneVariants>['tone']>

export { badgeToneVariants, type BadgeTone }
