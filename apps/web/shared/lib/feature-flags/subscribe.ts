import { featureFlagsService } from './feature-flags-service'

interface Options {
	refresh: () => Promise<unknown>
	onChange: (version: number) => void
	onConnection: (state: 'connecting' | 'connected' | 'reconnecting') => void
}
export function subscribeToFeatureFlags(options: Options): () => void {
	let source: EventSource | undefined
	let retry: ReturnType<typeof setTimeout> | undefined
	let stopped = false
	let delay = 1000
	let connecting = false
	const schedule = () => {
		if (stopped || retry) return
		retry = setTimeout(() => {
			retry = undefined
			void connect()
		}, delay)
		delay = Math.min(delay * 2, 30000)
	}
	const connect = async () => {
		if (stopped || connecting) return
		connecting = true
		source?.close()
		options.onConnection(source ? 'reconnecting' : 'connecting')
		try {
			// Uses the existing Axios/JWT refresh flow before opening the cookie-authenticated stream.
			await options.refresh()
			if (stopped) return
			source = new EventSource(featureFlagsService.eventsUrl(), { withCredentials: true })
			source.onopen = () => {
				delay = 1000
				options.onConnection('connected')
			}
			source.addEventListener('feature-flags-changed', (event) => {
				try {
					const { version } = JSON.parse((event as MessageEvent<string>).data) as {
						version: number
					}
					if (Number.isSafeInteger(version) && version >= 0) options.onChange(version)
				} catch {
					/* Invalid notifications never modify the snapshot. */
				}
			})
			source.addEventListener('session-expired', () => {
				source?.close()
				options.onConnection('reconnecting')
				schedule()
			})
			source.onerror = () => {
				source?.close()
				options.onConnection('reconnecting')
				schedule()
			}
		} catch {
			options.onConnection('reconnecting')
			schedule()
		} finally {
			connecting = false
		}
	}
	void connect()
	return () => {
		stopped = true
		source?.close()
		if (retry) clearTimeout(retry)
	}
}
