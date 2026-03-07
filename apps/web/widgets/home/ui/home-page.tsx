import { CtaSection } from './cta-section'
import { DeploySection } from './deploy-section'
import { FeaturesSection } from './features-section'
import { HeroSection } from './hero-section'
import { HomeFooter } from './home-footer'
import { HomeHeader } from './home-header'
import { PreviewSection } from './preview-section'

function HomePage() {
	return (
		<div className='relative min-h-screen overflow-x-hidden bg-background text-foreground'>
			<div className='pointer-events-none absolute inset-0'>
				<div className='absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-primary/18 blur-[120px]' />
				<div className='absolute right-[-80px] top-[180px] h-[360px] w-[360px] rounded-full bg-accent/10 blur-[120px]' />
				<div className='absolute bottom-[-160px] left-1/2 h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[160px]' />
			</div>

			<div className='relative mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 py-6 sm:px-6 lg:px-8'>
				<HomeHeader />

				<main className='flex flex-1 flex-col gap-10 py-8 sm:gap-12 lg:gap-16 lg:py-12'>
					<HeroSection />
					<FeaturesSection />
					<PreviewSection />
					<DeploySection />
					<CtaSection />
				</main>

				<HomeFooter />
			</div>
		</div>
	)
}

export { HomePage }
