import { Button } from '@repo/ui'

import { communityActions } from '../model/content'

function CtaSection() {
	return (
		<section id='community' className='border-t border-border py-[80px]'>
			<div className='mx-auto max-w-[1200px] text-center'>
				<h2 className='animate-home-fade-up mb-3 text-[28px] font-bold tracking-tight md:text-[32px]'>
					Открытый код
				</h2>
				<p className='mx-auto mb-10 max-w-[500px] text-base text-muted-foreground'>
					MIT лицензия. Предлагай улучшения, следи за roadmap и участвуй в развитии
					продукта.
				</p>
				<div className='animate-home-fade-up-delay flex flex-wrap items-center justify-center gap-4'>
					{communityActions.map((action) => {
						const Icon = action.icon

						return (
							<Button key={action.label} variant='outline' asChild>
								<a href={action.href}>
									<Icon className='h-4 w-4' />
									{action.label}
								</a>
							</Button>
						)
					})}
				</div>
			</div>
		</section>
	)
}

export { CtaSection }
