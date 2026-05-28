import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MeResponse } from '@/features/auth/api/auth-api'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN_COOKIE = 'kpi_access_token'
const REFRESH_TOKEN_COOKIE = 'kpi_refresh_token'

/**
 * Safely parse a cookie value that may or may not be JSON-encoded.
 * Guards against SyntaxError if the cookie was set without JSON.stringify
 * (e.g., directly by the browser or a backend Set-Cookie header).
 */
function parseCookieToken(raw: string | undefined): string {
  if (!raw) return ''
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export type AuthUser = MeResponse

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    refreshToken: string
    setRefreshToken: (refreshToken: string) => void
    resetAccessToken: () => void
    resetRefreshToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      const accessTokenCookie = getCookie(ACCESS_TOKEN_COOKIE)
      const refreshTokenCookie = getCookie(REFRESH_TOKEN_COOKIE)
      const initAccessToken = parseCookieToken(accessTokenCookie)
      const initRefreshToken = parseCookieToken(refreshTokenCookie)
      return {
        auth: {
          user: null,
          setUser: (user) =>
            set((state) => ({ ...state, auth: { ...state.auth, user } })),
          accessToken: initAccessToken,
          setAccessToken: (accessToken) =>
            set((state) => {
              setCookie(ACCESS_TOKEN_COOKIE, JSON.stringify(accessToken))
              return { ...state, auth: { ...state.auth, accessToken } }
            }),
          refreshToken: initRefreshToken,
          setRefreshToken: (refreshToken) =>
            set((state) => {
              setCookie(REFRESH_TOKEN_COOKIE, JSON.stringify(refreshToken))
              return { ...state, auth: { ...state.auth, refreshToken } }
            }),
          resetAccessToken: () =>
            set((state) => {
              removeCookie(ACCESS_TOKEN_COOKIE)
              return { ...state, auth: { ...state.auth, accessToken: '' } }
            }),
          resetRefreshToken: () =>
            set((state) => {
              removeCookie(REFRESH_TOKEN_COOKIE)
              return { ...state, auth: { ...state.auth, refreshToken: '' } }
            }),
          reset: () =>
            set((state) => {
              removeCookie(ACCESS_TOKEN_COOKIE)
              removeCookie(REFRESH_TOKEN_COOKIE)
              return {
                ...state,
                auth: {
                  ...state.auth,
                  user: null,
                  accessToken: '',
                  refreshToken: '',
                },
              }
            }),
        },
      }
    },
    {
      name: 'kpi-auth-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        auth: { user: state.auth.user },
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as { auth?: { user?: AuthUser | null } } | undefined
        return {
          ...current,
          auth: {
            ...current.auth,
            user: persistedState?.auth?.user ?? current.auth.user,
          },
        }
      },
    }
  )
)
