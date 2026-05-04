import { apiClient } from '@/lib/api-client'

export type UserListItem = {
  id: string
  code: string
  fullName: string
  email: string
  username: string
  orgId: string | null
  roleIds: string[]
  isActive: boolean
  lastLoginAt: string | null
}

export type UsersListResponse = {
  items: UserListItem[]
  meta: { total: number; page: number; limit: number }
}

export type UsersListQuery = {
  page?: number
  limit?: number
  search?: string
  q?: string
  isActive?: boolean
  status?: string
  orgId?: string
  roleId?: string
  departmentId?: string
  sort?: string
}

export type CreateUserInput = {
  username: string
  email: string
  password?: string
  fullName?: string
  phone?: string
  code?: string
  orgId?: string | null
  roleIds?: string[]
  departmentId?: string
  status?: string
  isActive?: boolean
}

export type UpdateUserInput = Partial<CreateUserInput>

export type Role = {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type RolesListResponse = {
  data: Role[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export const usersApi = {
  list: async (query: UsersListQuery) => {
    const response = await apiClient.get<UsersListResponse>('/users', { params: query })
    return response.data
  },
  create: async (input: CreateUserInput) => {
    const response = await apiClient.post<{ id: string }>('/users', input)
    return response.data
  },
  update: async (id: string, input: UpdateUserInput) => {
    const response = await apiClient.patch<{ ok: true }>(`/users/${id}`, input)
    return response.data
  },
  remove: async (id: string) => {
    const response = await apiClient.delete<{ ok: true }>(`/users/${id}`)
    return response.data
  },
  activate: async (id: string) => {
    const response = await apiClient.patch<{ ok: true }>(`/users/${id}/activate`)
    return response.data
  },
  deactivate: async (id: string) => {
    const response = await apiClient.patch<{ ok: true }>(`/users/${id}/deactivate`)
    return response.data
  },
}

export const rolesApi = {
  list: async (query?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<RolesListResponse>('/roles', { params: query })
    return response.data
  },
}
