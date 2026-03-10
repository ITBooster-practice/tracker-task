import axios from 'axios'

import { axiosConfig } from './axios-config'
import { toApiError } from './utils'

const publicClient = axios.create(axiosConfig)

publicClient.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(toApiError(error)),
)

export { publicClient }
