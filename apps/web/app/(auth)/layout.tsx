import { FEATURES } from '@/hooks/use-feature-flag'
import { AuthRouteGuard } from '@/lib/session/auth-route-guard'
import { SessionProvider } from '@/lib/session/session-provider'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
	children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
	if (!FEATURES.AUTH) {
		notFound()
	}

	return (
		<SessionProvider>
			<AuthRouteGuard>
				<div className='relative min-h-screen overflow-hidden bg-background text-foreground'>
					<div className='pointer-events-none absolute inset-0'>
						<div className='absolute left-0 top-0 h-[320px] w-[320px] rounded-full bg-primary/14 blur-[110px]' />
						<div className='absolute bottom-[-120px] right-[-40px] h-[320px] w-[320px] rounded-full bg-accent/10 blur-[120px]' />
					</div>

					<div className='relative mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-6 sm:px-6'>
						<div className='flex items-center justify-between gap-3'>
							<Link
								href='/'
								className='inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/55 px-3 py-2 transition-colors hover:bg-card'
							>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/12 text-sm font-semibold text-primary'>
									TT
								</div>
								<div className='hidden sm:block'>
									<p className='text-sm font-medium tracking-[0.24em] text-primary/90'>
										TRACKER TASK
									</p>
									<p className='text-xs text-muted-foreground'>Вернуться на главную</p>
								</div>
							</Link>

							<Link
								href='/'
								className='inline-flex items-center rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground'
							>
								На главную
							</Link>
						</div>

						<div className='flex flex-1 items-center justify-center py-8'>{children}</div>
					</div>
				</div>
			</AuthRouteGuard>
		</SessionProvider>
	)
}
