'use client'

import { Toaster as Sonner, toast, type ToasterProps } from 'sonner'
import {
	CircleCheckIcon,
	InfoIcon,
	TriangleAlertIcon,
	OctagonXIcon,
	Loader2Icon,
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			className='toaster group'
			icons={{
				success: <CircleCheckIcon className='size-6' />,
				info: <InfoIcon className='size-6' />,
				warning: <TriangleAlertIcon className='size-6' />,
				error: <OctagonXIcon className='size-6' />,
				loading: <Loader2Icon className='size-6 animate-spin' />,
			}}
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius-surface)',
				} as React.CSSProperties
			}
			toastOptions={{
				unstyled: true,
				classNames: {
					default:
						'p-4 gap-3 rounded-[var(--radius-surface)] flex w-[410px] shadow-[0_0_3px_rgba(0,0,0,0.1),0_6px_12px_-6px_rgba(0,0,0,0.07),0_8px_24px_-4px_rgba(0,0,0,0.05)]',
					toast: 'cn-toast',
					title: 'text-sm font-medium',
					description: 'text-sm opacity-70 mt-0.5',
					success: 'bg-success text-success-foreground',
					error: 'bg-destructive text-destructive-foreground',
					warning: 'bg-warning text-foreground',
					info: 'bg-info text-foreground',
				},
			}}
			{...props}
		/>
	)
}

export { Toaster, toast }
