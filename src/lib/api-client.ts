import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

type ApiEnvelope<T> = {
  data: T
  meta?: unknown
  error: null
}

type AuthRefreshResponse = {
  accessToken: string
  refreshToken?: string
  user: unknown
  expiresIn: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapEnvelope<T>(response: AxiosResponse<T | ApiEnvelope<T>>): AxiosResponse<T> {
  const payload = response.data
  if (isRecord(payload) && 'data' in payload && 'error' in payload) {
    return { ...response, data: (payload as ApiEnvelope<T>).data }
  }
  return response as AxiosResponse<T>
}

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/v1'

const refreshClient = axios.create({ baseURL })

let refreshPromise: Promise<AuthRefreshResponse> | null = null

async function refreshAccessToken(): Promise<AuthRefreshResponse> {
  if (refreshPromise) {
    return refreshPromise
  }

  const { auth } = useAuthStore.getState()
  if (!auth.refreshToken) {
    throw new Error('Thiếu refresh token.')
  }

  refreshPromise = refreshClient
    .post<AuthRefreshResponse | ApiEnvelope<AuthRefreshResponse>>('/auth/refresh-token', {
      refreshToken: auth.refreshToken,
    })
    .then((response) => unwrapEnvelope<AuthRefreshResponse>(response).data)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
  })

  client.interceptors.request.use((config) => {
    const { auth } = useAuthStore.getState()
    const token = auth.accessToken
    if (token) {
      config.headers = config.headers ?? {}
      if (!('Authorization' in config.headers) || !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  })

  client.interceptors.response.use(
    (response) => unwrapEnvelope(response),
    async (error: unknown) => {
      if (!(error instanceof AxiosError)) {
        return Promise.reject(error)
      }

      const status = error.response?.status
      const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined

      if (status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error)
      }

      const { auth } = useAuthStore.getState()
      if (!auth.refreshToken) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const refreshed = await refreshAccessToken()
        useAuthStore.getState().auth.setAccessToken(refreshed.accessToken)
        if (refreshed.refreshToken) {
          useAuthStore.getState().auth.setRefreshToken(refreshed.refreshToken)
        }
        useAuthStore.getState().auth.setUser(refreshed.user)

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`
        return client(originalRequest)
      } catch {
        useAuthStore.getState().auth.reset()
        return Promise.reject(error)
      }
    },
  )

  return client
}

export const apiClient = createApiClient()
