import {
  type CreatePeriodInput,
  type CreateRoleInput,
  type CreateUnitInput,
  type CreateUserInput,
  type OrganizationUnit,
  type Permission,
  type ReportPeriod,
  type Role,
  type SystemUser,
  type UpdatePeriodInput,
  type UpdateRoleInput,
  type UpdateUnitInput,
  type UpdateUserInput,
} from './types'
import { apiClient } from '@/lib/api-client'

const DEFAULT_ROLE_NAMES = new Set([
  'System Admin',
  'Data Manager',
  'Data Entry',
  'Approver',
])

const NETWORK_DELAY_MS = 220

const db: {
  users: SystemUser[]
  roles: Role[]
  units: OrganizationUnit[]
  periods: ReportPeriod[]
} = {
  roles: [
    {
      id: 'r1',
      name: 'System Admin',
      description: 'Quản trị toàn bộ hệ thống',
      dataScope: 'all_units',
      permissions: [
        'feature:view',
        'feature:create',
        'feature:update',
        'feature:delete',
        'feature:export',
        'report:assign',
        'report:approve',
      ],
      isDefault: true,
    },
    {
      id: 'r2',
      name: 'Data Manager',
      description: 'Điều phối giao và tổng hợp báo cáo',
      dataScope: 'child_units',
      permissions: [
        'feature:view',
        'feature:create',
        'feature:update',
        'feature:export',
        'report:assign',
      ],
      isDefault: true,
    },
    {
      id: 'r3',
      name: 'Data Entry',
      description: 'Nhập và gửi báo cáo đơn vị',
      dataScope: 'own_unit',
      permissions: ['feature:view', 'feature:create', 'feature:update'],
      isDefault: true,
    },
    {
      id: 'r4',
      name: 'Approver',
      description: 'Phê duyệt hoặc từ chối báo cáo',
      dataScope: 'child_units',
      permissions: ['feature:view', 'feature:export', 'report:approve'],
      isDefault: true,
    },
  ],
  units: [
    {
      id: 'u1',
      code: 'CQ-001',
      name: 'UBND Thành phố',
      level: 1,
      parentId: null,
      description: null,
      status: 'active',
      memberCount: 8,
      activeAssignments: 1,
    },
    {
      id: 'u2',
      code: 'PB-010',
      name: 'Phòng Nội vụ',
      level: 2,
      parentId: 'u1',
      description: null,
      status: 'active',
      memberCount: 4,
      activeAssignments: 0,
    },
    {
      id: 'u3',
      code: 'BP-021',
      name: 'Bộ phận KPI',
      level: 3,
      parentId: 'u2',
      description: null,
      status: 'active',
      memberCount: 3,
      activeAssignments: 2,
    },
    {
      id: 'u4',
      code: 'NH-001',
      name: 'Nhóm Tổng hợp',
      level: 4,
      parentId: 'u3',
      description: null,
      status: 'locked',
      memberCount: 0,
      activeAssignments: 0,
    },
  ],
  users: [
    {
      id: 'usr-01',
      userCode: 'USR001',
      fullName: 'Nguyễn Quốc Admin',
      email: 'admin.kpi@vnpt.vn',
      username: 'admin.kpi',
      unitId: 'u1',
      roleIds: ['r1'],
      status: 'active',
      lastLoginAt: '2026-04-20T07:20:00.000Z',
      incompleteReports: 0,
      isDeleted: false,
    },
    {
      id: 'usr-02',
      userCode: 'USR002',
      fullName: 'Trần Data Manager',
      email: 'manager.kpi@vnpt.vn',
      username: 'manager.kpi',
      unitId: 'u2',
      roleIds: ['r2'],
      status: 'active',
      lastLoginAt: '2026-04-19T14:35:00.000Z',
      incompleteReports: 0,
      isDeleted: false,
    },
    {
      id: 'usr-03',
      userCode: 'USR003',
      fullName: 'Lê Data Entry',
      email: 'entry.kpi@vnpt.vn',
      username: 'entry.kpi',
      unitId: 'u3',
      roleIds: ['r3'],
      status: 'inactive',
      lastLoginAt: null,
      incompleteReports: 2,
      isDeleted: false,
    },
  ],
  periods: [
    {
      id: 'p1',
      code: 'M-2026-04',
      name: 'Kỳ tháng 04/2026',
      type: 'month',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      status: 'open',
      assignedFormsCount: 6,
    },
    {
      id: 'p2',
      code: 'Q2-2026',
      name: 'Kỳ quý II/2026',
      type: 'quarter',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      status: 'open',
      assignedFormsCount: 2,
    },
    {
      id: 'p3',
      code: 'Y-2025',
      name: 'Kỳ năm 2025',
      type: 'year',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'closed',
      assignedFormsCount: 0,
    },
  ],
}

const wait = (ms = NETWORK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

async function simulate<T>(action: () => T): Promise<T> {
  await wait()
  return action()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueUserConstraint(input: {
  userCode: string
  username: string
  email: string
  id?: string
}) {
  const { id } = input
  const duplicatedCode = db.users.find(
    (user) => user.id !== id && normalize(user.userCode) === normalize(input.userCode)
  )
  if (duplicatedCode) {
    throw new Error('Mã người dùng đã tồn tại trong hệ thống.')
  }

  const duplicatedUsername = db.users.find(
    (user) => user.id !== id && normalize(user.username) === normalize(input.username)
  )
  if (duplicatedUsername) {
    throw new Error('Tên đăng nhập đã tồn tại trong hệ thống.')
  }

  const duplicatedEmail = db.users.find(
    (user) => user.id !== id && normalize(user.email) === normalize(input.email)
  )
  if (duplicatedEmail) {
    throw new Error('Email đã tồn tại trong hệ thống.')
  }
}

function ensureUnitExists(unitId: string) {
  const unit = db.units.find((item) => item.id === unitId)
  if (!unit) {
    throw new Error('Đơn vị không tồn tại.')
  }
  return unit
}

function ensureRolesExist(roleIds: string[]) {
  const missingRole = roleIds.find((roleId) => !db.roles.some((role) => role.id === roleId))
  if (missingRole) {
    throw new Error('Nhóm quyền không hợp lệ.')
  }
}

function ensurePeriodDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu.')
  }
}

function hasPeriodOverlap(
  type: ReportPeriod['type'],
  startDate: string,
  endDate: string,
  skipId?: string
) {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return db.periods.some((period) => {
    if (period.id === skipId || period.type !== type) {
      return false
    }
    const currentStart = new Date(period.startDate).getTime()
    const currentEnd = new Date(period.endDate).getTime()
    return start <= currentEnd && end >= currentStart
  })
}

function nextId(prefix: string, items: Array<{ id: string }>) {
  return `${prefix}-${items.length + 1}-${Date.now()}`
}

const legacyMockRuntime = {
  NETWORK_DELAY_MS,
  db,
  wait,
  simulate,
  normalize,
  uniqueUserConstraint,
  ensureUnitExists,
  ensureRolesExist,
  ensurePeriodDateRange,
  hasPeriodOverlap,
  nextId,
}
void legacyMockRuntime

export const systemAdminMockApi = {
  listUsers: async () => {
    type BeUser = {
      id: string
      code?: string
      userCode?: string
      fullName?: string
      email?: string
      username?: string
      orgId?: string | null
      unitId?: string | null
      roleIds?: string[]
      isActive?: boolean
      status?: string
      lastLoginAt?: string | null
    }

    const response = await apiClient.get<{ items: BeUser[] } | BeUser[]>('/users', {
      params: { page: 1, limit: 500 },
    })
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<SystemUser>((user) => ({
      id: user.id,
      userCode: user.code ?? user.userCode ?? '',
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      username: user.username ?? '',
      unitId: (user.orgId ?? user.unitId ?? '') || '',
      roleIds: user.roleIds ?? [],
      status: user.isActive === false || user.status === 'inactive' ? 'inactive' : 'active',
      lastLoginAt: user.lastLoginAt ?? null,
      incompleteReports: 0,
      isDeleted: false,
    }))
  },

  createUser: async (input: CreateUserInput) => {
    const response = await apiClient.post('/users', {
      code: input.userCode,
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      orgId: input.unitId || null,
      roleIds: input.roleIds,
      isActive: input.status === 'active',
    })

    const created = response.data as { id?: string } | SystemUser | undefined
    if (created && typeof created === 'object' && 'id' in created && typeof created.id === 'string') {
      const users = await systemAdminMockApi.listUsers()
      return users.find((user) => user.id === created.id) ?? (created as SystemUser)
    }

    const users = await systemAdminMockApi.listUsers()
    return users[0]
  },

  updateUser: async (userId: string, input: UpdateUserInput) => {
    await apiClient.patch(`/users/${userId}`, {
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      orgId: input.unitId || null,
      roleIds: input.roleIds,
      isActive: input.status === 'active',
    })

    const users = await systemAdminMockApi.listUsers()
    const updated = users.find((user) => user.id === userId)
    if (!updated) {
      throw new Error('Không tìm thấy người dùng.')
    }
    return updated
  },

  toggleUserStatus: async (userId: string) => {
    const users = await systemAdminMockApi.listUsers()
    const current = users.find((user) => user.id === userId)
    if (!current) {
      throw new Error('Không tìm thấy người dùng.')
    }

    if (current.status === 'active') {
      await apiClient.patch(`/users/${userId}/deactivate`)
    } else {
      await apiClient.patch(`/users/${userId}/activate`)
    }

    const after = await systemAdminMockApi.listUsers()
    const updated = after.find((user) => user.id === userId)
    if (!updated) {
      throw new Error('Không tìm thấy người dùng.')
    }
    return updated
  },

  resetUserPassword: async (userId: string) => {
    const response = await apiClient.post<{ tempPassword?: string; email?: string }>(
      `/users/${userId}/reset-password`,
      {},
    )
    return {
      tempPassword: response.data?.tempPassword ?? '',
      email: response.data?.email ?? '',
    }
  },

  deleteUser: async (userId: string) => {
    await apiClient.delete(`/users/${userId}`)
    return true
  },

  listPermissions: async () => {
    type BePermission = {
      id: string
      code?: string
      name?: string
      description?: string | null
    }

    const response = await apiClient.get<{ items: BePermission[] } | BePermission[]>(
      '/permissions',
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items
      .filter((permission) => Boolean(permission.id) && Boolean(permission.code))
      .map<Permission>((permission) => ({
        id: permission.id,
        code: permission.code ?? '',
        name: permission.name ?? permission.code ?? '',
        description: permission.description ?? null,
      }))
  },

  listRoles: async () => {
    type BeRoleGroup = {
      id: string
      name?: string
      description?: string | null
      permissions?: string[]
      permissionCodes?: string[]
      permissionIds?: string[]
      isDefault?: boolean
      isSystem?: boolean
    }

    let response: { data: { items?: BeRoleGroup[] } | BeRoleGroup[] }
    try {
      response = await apiClient.get<{ items: BeRoleGroup[] } | BeRoleGroup[]>(
        '/role-groups',
        { params: { page: 1, limit: 500 } },
      )
    } catch (error) {
      try {
        response = await apiClient.get<{ items: BeRoleGroup[] } | BeRoleGroup[]>(
          '/role-groups',
        )
      } catch (nestedError) {
        try {
          response = await apiClient.get<{ items: BeRoleGroup[] } | BeRoleGroup[]>(
            '/roles',
            { params: { page: 1, limit: 500 } },
          )
        } catch (finalError) {
          response = await apiClient.get<{ items: BeRoleGroup[] } | BeRoleGroup[]>('/roles')
        }
      }
    }
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<Role>((role) => ({
      id: role.id,
      name: role.name ?? '',
      description: role.description ?? '',
      dataScope: 'own_unit',
      permissions:
        role.permissions ??
        role.permissionCodes ??
        role.permissionIds ??
        [],
      isDefault: role.isDefault ?? role.isSystem ?? DEFAULT_ROLE_NAMES.has(role.name ?? ''),
    }))
  },

  createRole: async (input: CreateRoleInput) => {
    const tryCreate = async (path: string) => {
      try {
        return await apiClient.post(path, {
          name: input.name,
          description: input.description,
          permissionCodes: input.permissions,
        })
      } catch (error) {
        return await apiClient.post(path, {
          name: input.name,
          description: input.description,
          permissions: input.permissions,
        })
      }
    }

    let response: { data?: unknown }
    try {
      response = await tryCreate('/role-groups')
    } catch (error) {
      response = await tryCreate('/roles')
    }

    const created = response.data as { id?: string } | undefined
    if (created?.id) {
      const roles = await systemAdminMockApi.listRoles()
      return roles.find((role) => role.id === created.id) ?? {
        id: created.id,
        name: input.name,
        description: input.description,
        dataScope: input.dataScope,
        permissions: input.permissions,
        isDefault: false,
      }
    }

    const roles = await systemAdminMockApi.listRoles()
    return roles[0]
  },

  updateRole: async (roleId: string, input: UpdateRoleInput) => {
    const tryUpdate = async (path: string) => {
      try {
        await apiClient.patch(path, {
          name: input.name,
          description: input.description,
          permissionCodes: input.permissions,
        })
      } catch (error) {
        await apiClient.patch(path, {
          name: input.name,
          description: input.description,
          permissions: input.permissions,
        })
      }
    }

    try {
      await tryUpdate(`/role-groups/${roleId}`)
    } catch (error) {
      await tryUpdate(`/roles/${roleId}`)
    }

    const roles = await systemAdminMockApi.listRoles()
    const updated = roles.find((role) => role.id === roleId)
    if (!updated) {
      throw new Error('Không tìm thấy nhóm quyền.')
    }
    return updated
  },

  deleteRole: async (roleId: string) => {
    try {
      await apiClient.delete(`/role-groups/${roleId}`)
    } catch (error) {
      await apiClient.delete(`/roles/${roleId}`)
    }
    return true
  },

  listUnits: async () => {
    type BeOrgNode = {
      id: string
      code?: string
      name?: string
      parentId?: string | null
      isActive?: boolean
      status?: string
      level?: number
      description?: string | null
    }

    const response = await apiClient.get<{ items: BeOrgNode[] } | BeOrgNode[]>('/orgs', {
      params: { q: '', isActive: true },
    })
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<OrganizationUnit>((org) => ({
      id: org.id,
      code: org.code ?? '',
      name: org.name ?? '',
      level: org.level ?? 2,
      parentId: org.parentId ?? null,
      description: org.description ?? null,
      status: org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      memberCount: 0,
      activeAssignments: 0,
    }))
  },

  createUnit: async (input: CreateUnitInput) => {
    const response = await apiClient.post('/orgs', {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description: input.description,
      isActive: true,
    })

    const created = response.data as { id?: string } | undefined
    if (created?.id) {
      const units = await systemAdminMockApi.listUnits()
      return (
        units.find((unit) => unit.id === created.id) ?? {
          id: created.id,
          code: input.code,
          name: input.name,
          parentId: input.parentId,
          level: input.level,
          description: input.description ?? null,
          status: 'active',
          memberCount: 0,
          activeAssignments: 0,
        }
      )
    }

    const units = await systemAdminMockApi.listUnits()
    return units[0]
  },

  updateUnit: async (unitId: string, input: UpdateUnitInput) => {
    await apiClient.patch(`/orgs/${unitId}`, {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description: input.description,
    })

    const units = await systemAdminMockApi.listUnits()
    const updated = units.find((unit) => unit.id === unitId)
    if (!updated) {
      throw new Error('Không tìm thấy đơn vị.')
    }
    return updated
  },

  toggleUnitStatus: async (unitId: string) => {
    const units = await systemAdminMockApi.listUnits()
    const current = units.find((unit) => unit.id === unitId)
    if (!current) {
      throw new Error('Không tìm thấy đơn vị.')
    }

    if (current.status === 'active') {
      await apiClient.post(`/orgs/${unitId}/lock`)
    } else {
      await apiClient.post(`/orgs/${unitId}/unlock`)
    }

    const after = await systemAdminMockApi.listUnits()
    const updated = after.find((unit) => unit.id === unitId)
    if (!updated) {
      throw new Error('Không tìm thấy đơn vị.')
    }
    return updated
  },

  deleteUnit: async (unitId: string) => {
    await apiClient.delete(`/orgs/${unitId}`)
    return true
  },

  listPeriods: async () => {
    type BeReportPeriod = {
      id: string
      code?: string
      name?: string
      periodType?: string
      type?: string
      dateFrom?: string
      dateTo?: string
      startDate?: string
      endDate?: string
      isActive?: boolean
      status?: 'open' | 'closed' | string
    }

    const response = await apiClient.get<{ items: BeReportPeriod[] } | BeReportPeriod[]>(
      '/report-periods',
      { params: { page: 1, limit: 500 } },
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<ReportPeriod>((period) => ({
      id: period.id,
      code: period.code ?? '',
      name: period.name ?? '',
      periodType: (period.periodType ?? period.type ?? 'THANG') as ReportPeriod['periodType'],
      dateFrom: period.dateFrom ?? period.startDate ?? '',
      dateTo: period.dateTo ?? period.endDate ?? '',
      isActive:
        typeof period.isActive === 'boolean'
          ? period.isActive
          : period.status === 'closed'
            ? false
            : true,
      assignedFormsCount: 0,
    }))
  },

  createPeriod: async (input: CreatePeriodInput) => {
    const response = await apiClient.post('/report-periods', {
      code: input.code,
      name: input.name,
      periodType: input.periodType,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      isActive: input.isActive,
    })

    const created = response.data as { id?: string } | undefined
    if (created?.id) {
      const periods = await systemAdminMockApi.listPeriods()
      return (
        periods.find((period) => period.id === created.id) ?? {
          id: created.id,
          ...input,
          assignedFormsCount: 0,
        }
      )
    }

    const periods = await systemAdminMockApi.listPeriods()
    return periods[0]
  },

  updatePeriod: async (periodId: string, input: UpdatePeriodInput) => {
    await apiClient.patch(`/report-periods/${periodId}`, {
      name: input.name,
      periodType: input.periodType,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      isActive: input.isActive,
    })

    const periods = await systemAdminMockApi.listPeriods()
    const updated = periods.find((period) => period.id === periodId)
    if (!updated) {
      throw new Error('Không tìm thấy kỳ báo cáo.')
    }
    return updated
  },

  setPeriodActive: async (periodId: string, isActive: boolean) => {
    await apiClient.patch(`/report-periods/${periodId}`, { isActive })
    return true
  },

  deletePeriod: async (periodId: string) => {
    await apiClient.delete(`/report-periods/${periodId}`)
    return true
  },
}

export const organizationsApi = {
  list: async (params?: { q?: string; isActive?: boolean }) => {
    type BeOrgNode = {
      id: string
      code?: string
      name?: string
      parentId?: string | null
      isActive?: boolean
      status?: string
      level?: number
      description?: string | null
      children?: BeOrgNode[]
    }

    const tree = true
    const q = params?.q ?? ''
    const isActive = params?.isActive

    const requestParams: Record<string, unknown> = { tree, q }
    if (typeof isActive === 'boolean') {
      requestParams.isActive = isActive
    }

    const response = await apiClient.get<{ items: BeOrgNode[] } | BeOrgNode[]>('/orgs', {
      params: requestParams,
    })
    const payload = response.data
    const nodes = Array.isArray(payload) ? payload : payload.items ?? []

    const flatten = (node: BeOrgNode): BeOrgNode[] => {
      const items: BeOrgNode[] = [node]
      const children = node.children ?? []
      children.forEach((child) => items.push(...flatten(child)))
      return items
    }

    const flat = tree ? nodes.flatMap((node) => flatten(node)) : nodes

    return flat.map<OrganizationUnit>((org) => ({
      id: org.id,
      code: org.code ?? '',
      name: org.name ?? '',
      level: org.level ?? 2,
      parentId: org.parentId ?? null,
      description: org.description ?? null,
      status: org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      memberCount: 0,
      activeAssignments: 0,
    }))
  },

  get: async (id: string) => {
    type BeOrg = {
      id: string
      code?: string
      name?: string
      parentId?: string | null
      isActive?: boolean
      status?: string
      level?: number
      description?: string | null
    }

    const response = await apiClient.get<BeOrg>(`/orgs/${id}`)
    const org = response.data
    return {
      id: org.id,
      code: org.code ?? '',
      name: org.name ?? '',
      level: org.level ?? 2,
      parentId: org.parentId ?? null,
      description: org.description ?? null,
      status: org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      memberCount: 0,
      activeAssignments: 0,
    } satisfies OrganizationUnit
  },

  create: async (input: CreateUnitInput) => {
    const description =
      typeof input.description === 'string' && input.description.trim().length > 0
        ? input.description.trim()
        : null

    const response = await apiClient.post('/orgs', {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description,
    })

    const created = response.data as { id?: string } | undefined
    if (created?.id) {
      return organizationsApi.get(created.id)
    }
    const items = await organizationsApi.list({ q: '', isActive: true })
    return items[0]
  },

  update: async (id: string, input: UpdateUnitInput) => {
    const description =
      typeof input.description === 'string' && input.description.trim().length > 0
        ? input.description.trim()
        : null

    await apiClient.patch(`/orgs/${id}`, {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description,
    })
    return organizationsApi.get(id)
  },

  lock: async (id: string) => {
    await apiClient.post(`/orgs/${id}/lock`)
  },

  unlock: async (id: string) => {
    await apiClient.post(`/orgs/${id}/unlock`)
  },

  delete: async (id: string) => {
    await apiClient.delete(`/orgs/${id}`)
    return true
  },
}

export const periodsApi = {
  list: systemAdminMockApi.listPeriods,
  create: systemAdminMockApi.createPeriod,
  update: systemAdminMockApi.updatePeriod,
  setActive: systemAdminMockApi.setPeriodActive,
  delete: systemAdminMockApi.deletePeriod,
}
