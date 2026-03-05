import Link from 'next/link'

import { Button, EmptyState } from '@repo/ui'

export default function GlobalNotFound() {
	return (
		<main className='flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100'>
			<EmptyState
				className='border-slate-800 bg-slate-900'
				icon='404'
				title='Страница не найдена'
				description='Проверьте адрес страницы или вернитесь на главную.'
				action={
					<Button asChild>
						<Link href='/'>На главную</Link>
					</Button>
				}
			/>
		</main>
	)
}
