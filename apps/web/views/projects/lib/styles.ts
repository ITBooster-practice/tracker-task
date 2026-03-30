import { cn } from '@repo/ui'

export const projectPageHeaderClassName =
	'mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'

export const projectPageTitleClassName =
	'text-[34px] font-semibold leading-[1] tracking-tight'

export const projectPageSubtitleClassName = 'mt-1.5 text-[15px] text-muted-foreground'

export const projectPagePrimaryButtonClassName =
	'h-9 w-full sm:w-auto rounded-[var(--radius-control)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'

export const projectDialogContentClassName = (isDesktop: boolean) =>
	cn(
		'rounded-[var(--radius-surface)] border-border bg-card p-0 shadow-[0_30px_80px_-34px_rgba(0,0,0,0.55)]',
		{ 'sm:max-w-[396px]': isDesktop },
	)

export const projectDialogHeaderClassName = 'mb-4 items-start text-left'

export const projectDialogTitleClassName = 'text-[18px] font-semibold tracking-tight'

export const projectDialogLabelClassName = 'text-[13px] font-medium mb-1.5'

export const projectDialogInputClassName =
	'h-10 w-full rounded-[var(--radius-control)] border-border bg-background text-[14px] shadow-none focus-visible:ring-[3px]'

export const projectDialogFooterClassName = (isDesktop: boolean) =>
	cn({ 'flex-col-reverse': !isDesktop })

export const projectDialogSecondaryButtonClassName =
	'h-10 w-full sm:w-auto rounded-[var(--radius-control)] border-border bg-background px-5 text-[14px] font-medium'

export const projectDialogPrimaryButtonClassName =
	'h-10 w-full sm:w-auto rounded-[var(--radius-control)] bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-primary/65'
