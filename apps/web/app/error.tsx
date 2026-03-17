'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button, EmptyState } from '@repo/ui'

import { ROUTES } from '@/shared/config'

type GlobalErrorProps = {
	error: Error & { digest?: string }
	reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<main className='flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100'>
			<EmptyState
				className='border-slate-800 bg-slate-900'
				icon='!'
				title='Что-то пошло не так'
				description='Произошла ошибка. Попробуйте повторить действие или вернуться на главную.'
				action={
					<div className='flex items-center gap-2'>
						<Button onClick={reset}>Попробовать снова</Button>
						<Button
							asChild
							variant='ghost'
							className='border border-slate-700 !bg-slate-800 !text-slate-100 hover:!bg-slate-700 hover:!text-white'
						>
							<Link href={ROUTES.home}>На главную</Link>
						</Button>
					</div>
				}
			/>
		</main>
	)
}
