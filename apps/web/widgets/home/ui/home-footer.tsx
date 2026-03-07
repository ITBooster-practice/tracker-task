import Link from 'next/link'

function HomeFooter() {
	return (
		<footer className='border-t border-border/70 py-5 text-sm text-muted-foreground'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<p>Tracker Task. Open-source system for projects, tasks and sprints.</p>
				<div className='flex flex-wrap gap-4'>
					<Link href='/login' className='transition-colors hover:text-foreground'>
						Войти
					</Link>
					<Link href='/register' className='transition-colors hover:text-foreground'>
						Signup
					</Link>
					<Link
						href='https://github.com/ITBooster-practice/tracker-task'
						className='transition-colors hover:text-foreground'
					>
						GitHub
					</Link>
				</div>
			</div>
		</footer>
	)
}

export { HomeFooter }
