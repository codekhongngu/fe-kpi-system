import { apiClient } from '@/lib/api-client'

export type AuthResponse = {
  accessToken: string
  refreshToken?: string
  user: unknown
  expiresIn: number
}

export type LoginInput = {
  usernameOrEmail: string
  password: string
}

export type RegisterInput = {
  username: string
  email: string
  password: string
  fullName?: string
  phone?: string
}

export type ChangePasswordInput = {
  oldPassword: string
  newPassword: string
}

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
}

export type MeResponse = {
  id: string
  code: string
  fullName: string
  email: string
  username: string
  phone?: string | null
  avatarUrl?: string | null
  orgId: string | null
  roleIds: string[]
  permissions: string[]
  language: string
  timezone: string
  notifyChannel: 'IN_APP' | 'EMAIL' | 'BOTH'
  notificationPrefs?: Record<string, { inApp: boolean; email: boolean }>
}

export const authApi = {
  login: async (input: LoginInput) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', input)
    return response.data
  },
  register: async (input: RegisterInput) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', input)
    return response.data
  },
  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh-token', {
      refreshToken,
    })
    return response.data
  },
  me: async () => {
    const response = await apiClient.get<MeResponse>('/auth/me')
    return response.data
  },
  changePassword: async (input: ChangePasswordInput) => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/change-password',
      input
    )
    return response.data
  },
  forgotPassword: async (input: ForgotPasswordInput) => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/forgot-password',
      input
    )
    return response.data
  },
  resetPassword: async (input: ResetPasswordInput) => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/reset-password',
      input
    )
    return response.data
  },
  logout: async (refreshToken?: string) => {
    const response = await apiClient.post<{ message: string }>('/auth/logout', {
      refreshToken,
    })
    return response.data
  },
}
