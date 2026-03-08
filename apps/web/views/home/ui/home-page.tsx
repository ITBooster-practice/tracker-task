import { CtaSection } from './cta-section'
import { DeploySection } from './deploy-section'
import { FeaturesSection } from './features-section'
import { HeroSection } from './hero-section'
import { HomeFooter } from './home-footer'
import { HomeHeader } from './home-header'

function HomePage() {
	return (
		<div className='min-h-screen bg-background text-foreground'>
			<HomeHeader />

			<div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1280px] flex-col px-5 sm:px-6 lg:px-8'>
				<main className='flex flex-1 flex-col'>
					<HeroSection />
					<FeaturesSection />
					<DeploySection />
					<CtaSection />
				</main>

				<HomeFooter />
			</div>
		</div>
	)
}

export { HomePage }
