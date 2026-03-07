import Link from 'next/link'

function CtaSection() {
	return (
		<section className='rounded-[34px] border border-primary/25 bg-primary/10 p-6 shadow-level-2 sm:p-8 lg:p-10'>
			<div className='flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between'>
				<div className='max-w-[760px] space-y-4'>
					<p className='text-xs uppercase tracking-[0.24em] text-primary'>Get started</p>
					<h2 className='text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl'>
						Покажи команде современный task tracker без тяжелой настройки.
					</h2>
					<p className='text-sm leading-7 text-muted-foreground sm:text-base'>
						Используй публичную home page как входную точку продукта: регистрация,
						документация, GitHub и быстрый доступ к рабочему пространству.
					</p>
				</div>

				<div className='flex flex-col gap-3 sm:flex-row'>
					<Link
						href='/register'
						className='inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 hover:opacity-95'
					>
						Создать аккаунт
					</Link>
					<Link
						href='https://github.com/ITBooster-practice/tracker-task'
						className='inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background/70 px-6 text-sm text-foreground transition-colors hover:bg-background'
					>
						GitHub
					</Link>
				</div>
			</div>
		</section>
	)
}

export { CtaSection }
