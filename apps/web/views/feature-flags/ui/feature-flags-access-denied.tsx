import { EmptyState } from '@repo/ui'
import { ShieldX } from '@repo/ui/icons'

export function FeatureFlagsAccessDenied() {
	return (
		<div className='flex min-h-full w-full items-center justify-center p-6'>
			<EmptyState
				role='alert'
				title='Доступ запрещён'
				description='Управление флагами доступно только разработчику системы.'
				icon={<ShieldX className='size-7 text-primary' aria-hidden='true' />}
				className='border-border/60 bg-card/70 shadow-sm sm:p-10'
			/>
		</div>
	)
}
