import {
	featureFlagMutationSchema,
	featureFlagsAccessSchema,
	featureFlagsListSchema,
	featureFlagsSnapshotSchema,
	type FeatureFlagsSnapshot,
	type UpdateFeatureFlag,
} from '@repo/types'

import { client } from '../api/client'

const endpoint = '/feature-flags'
export const featureFlagsService = {
	async snapshot(
		known?: FeatureFlagsSnapshot,
		signal?: AbortSignal,
	): Promise<FeatureFlagsSnapshot> {
		const response = await client.get(endpoint + '/snapshot', {
			signal,
			headers: known
				? { 'If-None-Match': '"feature-flags-' + known.version + '"' }
				: undefined,
			validateStatus: (status) => status === 200 || status === 304,
		})
		if (response.status === 304 && known) return known
		return featureFlagsSnapshotSchema.parse(response.data)
	},
	async access(signal?: AbortSignal) {
		return featureFlagsAccessSchema.parse(
			(await client.get(endpoint + '/access', { signal })).data,
		)
	},
	async list(signal?: AbortSignal) {
		return featureFlagsListSchema.parse((await client.get(endpoint, { signal })).data)
	},
	async update(id: string, body: UpdateFeatureFlag) {
		return featureFlagMutationSchema.parse(
			(await client.patch(endpoint + '/' + encodeURIComponent(id), body)).data,
		)
	},
	eventsUrl() {
		return (client.defaults.baseURL ?? '').replace(/\/$/, '') + endpoint + '/events'
	},
}
