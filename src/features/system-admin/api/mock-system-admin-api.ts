import { apiClient } from '@/lib/api-client'
import {
  ALL_PERMISSION_CODES,
  FIXED_ROLE_PERMISSIONS,
  FIXED_ROLES,
  isValidPermissionUuid,
  mapPermissionCodesToUuidIds,
  PERMISSION_GROUPS,
  type DataScope,
  type CreatePeriodInput,
  type CreateRoleInput,
  type CreateUnitInput,
  type CreateUserInput,
  type OrganizationUnit,
  type Permission,
  type ReportPeriod,
  type Role,
  type RolePermissionsResult,
  type SystemUser,
  type UpdatePeriodInput,
  type UpdateRoleInput,
  type UpdateUnitInput,
  type UpdateUserInput,
} from './types'

function buildCatalogPermissions(): Permission[] {
  const labelByCode = new Map(
    PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((item) => [item.code, item.label] as const)
    )
  )
  return ALL_PERMISSION_CODES.map((code) => ({
    id: '',
    code,
    name: labelByCode.get(code) ?? code,
    description: null,
  }))
}

function mapPermissionCodesToIds(
  codes: string[],
  permissions: Permission[]
): string[] {
  return mapPermissionCodesToUuidIds(codes, permissions).ids
}

function buildFixedRoles(permissions: Permission[]): Role[] {
  return FIXED_ROLES.map((meta) => {
    const codes = FIXED_ROLE_PERMISSIONS[meta.code] ?? []
    const permissionIds = mapPermissionCodesToIds(codes, permissions)
    return {
      ...meta,
      permissionIds,
      permissions: codes,
      permissionCount: codes.length,
    }
  })
}

async function fetchPermissionsFromApi(): Promise<Permission[]> {
  type BePermission = {
    id?: string
    code?: string
    name?: string
    description?: string | null
  }

  let response: { data: { items?: BePermission[] } | BePermission[] }
  try {
    response = await apiClient.get<{ items: BePermission[] } | BePermission[]>(
      '/permissions',
      { params: { page: 1, limit: 100 } }
    )
  } catch {
    response = await apiClient.get<{ items: BePermission[] } | BePermission[]>(
      '/permissions'
    )
  }

  const payload = response.data
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: BePermission[] }).data ?? [])
      : ((payload as { items?: BePermission[] }).items ?? [])

  const result: Permission[] = []
  for (const permission of items) {
    const id = String(permission.id ?? '').trim()
    const code = String(permission.code ?? '').trim()
    if (!id || !code || !isValidPermissionUuid(id)) continue
    const rawName = String(permission.name ?? '').trim()
    const name =
      !rawName || rawName === code ? humanizePermissionCode(code) : rawName
    result.push({
      id,
      code,
      name: name || code,
      description: permission.description ?? null,
    })
  }
  return result
}

function mergePermissionsWithCatalog(apiItems: Permission[]): Permission[] {
  const labelByCode = new Map(
    PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((item) => [item.code, item.label] as const)
    )
  )

  const fromApi: Permission[] = []
  for (const item of apiItems) {
    const code = (item.code ?? '').trim()
    if (!code || !isValidPermissionUuid(item.id)) continue
    const catalogLabel = labelByCode.get(code)
    fromApi.push({
      ...item,
      code,
      name: catalogLabel ?? item.name ?? code,
    })
  }

  if (fromApi.length > 0) {
    return fromApi.sort((a, b) => a.code.localeCompare(b.code, 'vi'))
  }

  return buildCatalogPermissions()
}

const NETWORK_DELAY_MS = 220

type RolePermissionsItem =
  | string
  | {
      id?: unknown
      code?: unknown
      name?: unknown
      description?: unknown
      permissionId?: unknown
      permission?: { id?: unknown; code?: unknown; name?: unknown }
    }

function parseRolePermissionsPayload(payload: unknown): RolePermissionsResult {
  const permissionIds: string[] = []
  const permissionCodes: string[] = []
  const permissions: Permission[] = []
  const seenIds = new Set<string>()

  const pushItem = (raw: RolePermissionsItem) => {
    if (typeof raw === 'string') {
      const code = raw.trim()
      if (code && !permissionCodes.includes(code)) permissionCodes.push(code)
      return
    }
    if (!raw || typeof raw !== 'object') return

    const asAny = raw as {
      id?: unknown
      code?: unknown
      name?: unknown
      description?: unknown
      permissionId?: unknown
      permission?: { id?: unknown; code?: unknown; name?: unknown }
    }

    let id = ''
    let code = ''
    let name = ''

    if (typeof asAny.id === 'string' && isValidPermissionUuid(asAny.id)) {
      id = asAny.id
    }
    if (typeof asAny.permissionId === 'string' && isValidPermissionUuid(asAny.permissionId)) {
      id = asAny.permissionId
    }
    if (asAny.permission && typeof asAny.permission === 'object') {
      if (typeof asAny.permission.id === 'string' && isValidPermissionUuid(asAny.permission.id)) {
        id = asAny.permission.id
      }
      if (typeof asAny.permission.code === 'string') {
        code = asAny.permission.code.trim()
      }
      if (typeof asAny.permission.name === 'string') {
        name = asAny.permission.name.trim()
      }
    }
    if (typeof asAny.code === 'string') code = asAny.code.trim()
    if (typeof asAny.name === 'string') name = asAny.name.trim()

    if (code && !permissionCodes.includes(code)) permissionCodes.push(code)
    if (id && !permissionIds.includes(id)) permissionIds.push(id)

    if (id && code && !seenIds.has(id)) {
      seenIds.add(id)
      permissions.push({
        id,
        code,
        name: name || humanizePermissionCode(code) || code,
        description:
          typeof asAny.description === 'string' ? asAny.description : null,
      })
    }
  }

  const arr = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as { items?: unknown }).items)
        ? (payload as { items: unknown[] }).items
        : Array.isArray((payload as { data?: unknown }).data)
          ? (payload as { data: unknown[] }).data
          : Array.isArray((payload as { permissions?: unknown }).permissions)
            ? (payload as { permissions: unknown[] }).permissions
            : []
      : []

  ;(arr as RolePermissionsItem[]).forEach(pushItem)

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const obj = payload as {
      permissionIds?: unknown
      permissionCodes?: unknown
      permissions?: unknown
    }
    if (Array.isArray(obj.permissionIds)) {
      for (const id of obj.permissionIds) {
        if (typeof id === 'string' && isValidPermissionUuid(id) && !permissionIds.includes(id)) {
          permissionIds.push(id)
        }
      }
    }
    if (Array.isArray(obj.permissionCodes)) {
      for (const code of obj.permissionCodes) {
        if (typeof code === 'string' && code.trim() && !permissionCodes.includes(code.trim())) {
          permissionCodes.push(code.trim())
        }
      }
    }
    if (obj.permissions) {
      const nested = parseRolePermissionsPayload(obj.permissions)
      for (const id of nested.permissionIds) {
        if (!permissionIds.includes(id)) permissionIds.push(id)
      }
      for (const code of nested.permissionCodes) {
        if (!permissionCodes.includes(code)) permissionCodes.push(code)
      }
      for (const perm of nested.permissions) {
        if (!seenIds.has(perm.id)) {
          seenIds.add(perm.id)
          permissions.push(perm)
        }
      }
    }
  }

  return { permissionIds, permissionCodes, permissions }
}

async function fetchRolePermissionsFromApi(
  roleId: string
): Promise<RolePermissionsResult> {
  const response = await apiClient.get(`/roles/${roleId}/permissions`)
  return parseRolePermissionsPayload(response.data)
}

function titleize(value: string) {
  if (!value) return ''
  return value
    .split(/\s+/g)
    .map((word) =>
      word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''
    )
    .join(' ')
    .trim()
}

function humanizePermissionCode(code: string) {
  const normalized = (code ?? '').trim()
  if (!normalized) return ''

  const parts = normalized.split(/[.:]/g).filter(Boolean)
  if (parts.length === 0) return normalized

  const action = parts[parts.length - 1]
  const resources = parts.slice(0, -1)

  const actionMap: Record<string, string> = {
    view: 'Xem',
    read: 'Xem',
    list: 'Xem danh sách',
    create: 'Tạo mới',
    update: 'Cập nhật',
    edit: 'Cập nhật',
    delete: 'Xóa',
    remove: 'Xóa',
    export: 'Xuất',
    import: 'Nhập',
    assign: 'Phân công',
    approve: 'Phê duyệt',
    reject: 'Từ chối',
    manage: 'Quản lý',
    lock: 'Khóa',
    unlock: 'Mở khóa',
  }

  const resourceMap: Record<string, string> = {
    feature: 'Chức năng',
    report: 'Báo cáo',
    reports: 'Báo cáo',
    periods: 'Kỳ báo cáo',
    'report-periods': 'Kỳ báo cáo',
    forms: 'Biểu mẫu',
    roles: 'Vai trò',
    permissions: 'Quyền',
    users: 'Người dùng',
    orgs: 'Đơn vị',
    organizations: 'Đơn vị',
    units: 'Đơn vị',
    system: 'Hệ thống',
    admin: 'Quản trị',
  }

  const resourceLabel =
    resources.length > 0
      ? resources
        .map(
          (item) => resourceMap[item] ?? titleize(item.replace(/[-_]/g, ' '))
        )
        .join(' / ')
      : ''

  const actionLabel =
    actionMap[action] ?? titleize(action.replace(/[-_]/g, ' '))

  if (resourceLabel) return `${resourceLabel} - ${actionLabel}`
  return actionLabel || normalized
}

const db: {
  users: SystemUser[]
  roles: Role[]
  units: OrganizationUnit[]
} = {
  roles: buildFixedRoles(buildCatalogPermissions()),
  units: [
    {
      id: 'u1',
      code: 'CQ-001',
      name: 'UBND Thành phố',
      level: 1,
      parentId: null,
      description: null,
      status: 'active',
      canAssignReports: true,
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
      canAssignReports: true,
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
      canAssignReports: true,
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
      canAssignReports: false,
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
    (user) =>
      user.id !== id && normalize(user.userCode) === normalize(input.userCode)
  )
  if (duplicatedCode) {
    throw new Error('Mã người dùng đã tồn tại trong hệ thống.')
  }

  const duplicatedUsername = db.users.find(
    (user) =>
      user.id !== id && normalize(user.username) === normalize(input.username)
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
  const missingRole = roleIds.find(
    (roleId) => !db.roles.some((role) => role.id === roleId)
  )
  if (missingRole) {
    throw new Error('Vai trò không hợp lệ.')
  }
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

    const response = await apiClient.get<{ items: BeUser[] } | BeUser[]>(
      '/users',
      {
        params: { page: 1, limit: 200 },
      }
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])

    return items.map<SystemUser>((user) => ({
      id: user.id,
      userCode: user.code ?? user.userCode ?? '',
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      username: user.username ?? '',
      unitId: (user.orgId ?? user.unitId ?? '') || '',
      roleIds: user.roleIds ?? [],
      status:
        user.isActive === false || user.status === 'inactive'
          ? 'inactive'
          : 'active',
      lastLoginAt: user.lastLoginAt ?? null,
      incompleteReports: 0,
      isDeleted: false,
    }))
  },

  createUser: async (input: CreateUserInput) => {
    let response: { data?: unknown }
    try {
      response = await apiClient.post('/users', {
        code: input.userCode,
        fullName: input.fullName,
        email: input.email,
        username: input.username,
        password: input.password,
        orgId: input.unitId || null,
        roleIds: input.roleIds,
        isActive: input.status === 'active',
      })
    } catch (error) {
      response = await apiClient.post('/users', {
        code: input.userCode,
        fullName: input.fullName,
        email: input.email,
        username: input.username,
        password: input.password,
        orgId: input.unitId || null,
        isActive: input.status === 'active',
      })
    }

    const created = response.data as { id?: string } | SystemUser | undefined
    if (
      created &&
      typeof created === 'object' &&
      'id' in created &&
      typeof created.id === 'string'
    ) {
      if (input.roleIds.length > 0) {
        await systemAdminMockApi.assignRolesToUser(created.id, input.roleIds)
      }
      const users = await systemAdminMockApi.listUsers()
      return (
        users.find((user) => user.id === created.id) ?? (created as SystemUser)
      )
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
      isActive: input.status === 'active',
    })

    if (input.roleIds.length > 0) {
      await systemAdminMockApi.assignRolesToUser(userId, input.roleIds)
    }

    const users = await systemAdminMockApi.listUsers()
    const updated = users.find((user) => user.id === userId)
    if (!updated) {
      throw new Error('Không tìm thấy người dùng.')
    }
    return updated
  },

  assignRolesToUser: async (userId: string, roleIds: string[]) => {
    await apiClient.patch(`/users/${userId}/roles`, { roleIds })

    const users = await systemAdminMockApi.listUsers()
    const updated = users.find((user) => user.id === userId)
    if (!updated) {
      throw new Error('Không tìm thấy người dùng.')
    }
    return updated
  },

  getUserPermissions: async (userId: string) => {
    const response = await apiClient.get<
      | string[]
      | { items?: string[] }
      | Array<{ code?: string }>
      | { items?: Array<{ code?: string }> }
    >(`/users/${userId}/permissions`)

    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])

    return items
      .map((item) => (typeof item === 'string' ? item : (item.code ?? '')))
      .filter((value) => Boolean(value))
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
    const response = await apiClient.post<unknown>(
      `/users/${userId}/reset-password`,
      {}
    )
    const payload = response.data as any
    const tempPassword =
      (typeof payload?.tempPassword === 'string' && payload.tempPassword) ||
      (typeof payload?.temporaryPassword === 'string' &&
        payload.temporaryPassword) ||
      ''
    const email = typeof payload?.email === 'string' ? payload.email : ''
    return { tempPassword, email }
  },

  deleteUser: async (userId: string) => {
    await apiClient.delete(`/users/${userId}`)
    return true
  },

  listPermissions: async () => {
    try {
      const apiItems = await fetchPermissionsFromApi()
      if (apiItems.length > 0) {
        return mergePermissionsWithCatalog(apiItems)
      }
    } catch {
      // fallback below
    }

    return buildCatalogPermissions()
  },

  listRoles: async () => {
    type BeRole = {
      id: string
      code?: string
      name?: string
      description?: string | null
      dataScope?: DataScope
      permissionCount?: number
      permissions?:
      | string[]
      | Array<{
        id?: string
        code?: string
        permissionId?: string
        permission?: { id?: string; code?: string }
      }>
      | { items?: unknown[]; data?: unknown[] }
      permissionCodes?: string[]
      permissionIds?: string[]
      rolePermissions?: Array<{
        permissionId?: string
        permission?: { id?: string; code?: string }
      }>
      isDefault?: boolean
      isSystem?: boolean
    }

    const extractPermissions = (
      role: BeRole
    ): { permissionIds: string[]; permissionCodes: string[] } => {
      const collect = (
        raw: unknown
      ): { permissionIds: string[]; permissionCodes: string[] } => {
        const ids: string[] = []
        const codes: string[] = []

        const arr = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object'
            ? Array.isArray((raw as { items?: unknown }).items)
              ? (raw as { items: unknown[] }).items
              : Array.isArray((raw as { data?: unknown }).data)
                ? (raw as { data: unknown[] }).data
                : []
            : []

        arr.forEach((item) => {
          if (typeof item === 'string') {
            codes.push(item)
            return
          }

          if (!item || typeof item !== 'object') return

          const asAny = item as {
            id?: unknown
            code?: unknown
            permissionId?: unknown
            permission?: { id?: unknown; code?: unknown }
          }

          if (typeof asAny.id === 'string') ids.push(asAny.id)
          if (typeof asAny.code === 'string') codes.push(asAny.code)
          if (typeof asAny.permissionId === 'string')
            ids.push(asAny.permissionId)
          if (asAny.permission && typeof asAny.permission === 'object') {
            if (typeof asAny.permission.id === 'string')
              ids.push(asAny.permission.id)
            if (typeof asAny.permission.code === 'string')
              codes.push(asAny.permission.code)
          }
        })

        return {
          permissionIds: ids.filter(Boolean),
          permissionCodes: codes.filter(Boolean),
        }
      }

      const fromPermissions = collect(role.permissions)
      if (
        fromPermissions.permissionIds.length > 0 ||
        fromPermissions.permissionCodes.length > 0
      ) {
        return fromPermissions
      }

      const fromRolePermissions = collect(role.rolePermissions)
      return fromRolePermissions
    }

    try {
      let response: {
        data: { items?: BeRole[] } | { data?: BeRole[] } | BeRole[]
      }
      try {
        response = await apiClient.get<
          { items: BeRole[] } | { data?: BeRole[] } | BeRole[]
        >('/roles', {
          params: { include: 'permissionCount', limit: 100, page: 1 },
        })
      } catch {
        response = await apiClient.get<
          { items: BeRole[] } | { data?: BeRole[] } | BeRole[]
        >('/roles', { params: { include: 'permissionCount', limit: 100 } })
      }
      const payload = response.data
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: BeRole[] }).data ?? [])
          : ((payload as { items?: BeRole[] }).items ?? [])

      if (items.length === 0) return []

      return items.map((role) => {
        const extracted = extractPermissions(role)
        const code = (role.code ?? '').trim()

        const permissionIds = Array.isArray(role.permissionIds)
          ? role.permissionIds.filter(isValidPermissionUuid)
          : extracted.permissionIds

        const permissionCodes = Array.isArray(role.permissionCodes)
          ? role.permissionCodes
          : extracted.permissionCodes

        const permissionCount =
          typeof role.permissionCount === 'number' &&
          Number.isFinite(role.permissionCount)
            ? Math.max(0, Math.floor(role.permissionCount))
            : permissionIds.length > 0
              ? permissionIds.length
              : permissionCodes.length

        return {
          id: role.id,
          code,
          name: role.name ?? '',
          description: role.description ?? '',
          dataScope: (role.dataScope ?? 'own_unit') as DataScope,
          permissionIds,
          permissions: permissionCodes,
          permissionCount,
          isDefault: Boolean(role.isDefault ?? role.isSystem ?? true),
        } satisfies Role
      })
    } catch {
      return []
    }
  },

  getRolePermissions: async (roleId: string): Promise<RolePermissionsResult> => {
    try {
      return await fetchRolePermissionsFromApi(roleId)
    } catch {
      return {
        permissionIds: [],
        permissionCodes: [],
        permissions: [],
      }
    }
  },

  createRole: async (input: CreateRoleInput) => {
    const permissionIds =
      input.permissionIds.length > 0
        ? input.permissionIds.filter(isValidPermissionUuid)
        : mapPermissionCodesToIds(
            input.permissions,
            await systemAdminMockApi.listPermissions()
          )

    const response = await apiClient.post('/roles', {
      code: input.code,
      name: input.name,
      description: input.description,
    })

    const created = response.data as { id?: string } | undefined
    if (created?.id) {
      await apiClient.patch(`/roles/${created.id}/permissions`, {
        permissionIds,
      })

      const roles = await systemAdminMockApi.listRoles()
      return (
        roles.find((role) => role.id === created.id) ?? {
          id: created.id,
          code: input.code,
          name: input.name,
          description: input.description,
          dataScope: input.dataScope,
          permissionIds,
          permissions: input.permissions,
          permissionCount: permissionIds.length,
          isDefault: false,
        }
      )
    }

    const roles = await systemAdminMockApi.listRoles()
    return roles[0]
  },

  updateRole: async (roleId: string, input: UpdateRoleInput) => {
    const permissionIds =
      input.permissionIds.length > 0
        ? input.permissionIds.filter(isValidPermissionUuid)
        : mapPermissionCodesToIds(
            input.permissions,
            await systemAdminMockApi.listPermissions()
          )

    await apiClient.patch(`/roles/${roleId}`, {
      name: input.name,
      description: input.description,
    })

    await apiClient.patch(`/roles/${roleId}/permissions`, { permissionIds })

    const roles = await systemAdminMockApi.listRoles()
    const updated = roles.find((role) => role.id === roleId)
    if (!updated) {
      throw new Error('Không tìm thấy nhóm quyền.')
    }
    return updated
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const validIds = permissionIds.filter(isValidPermissionUuid)
    if (validIds.length !== permissionIds.length) {
      throw new Error(
        'ID quyền không hợp lệ. Vui lòng tải lại trang và thử lại.'
      )
    }

    await apiClient.patch(`/roles/${roleId}/permissions`, {
      permissionIds: validIds,
    })

    const roles = await systemAdminMockApi.listRoles()
    const updated = roles.find((role) => role.id === roleId)
    if (!updated) {
      throw new Error('Không tìm thấy nhóm quyền.')
    }
    return updated
  },

  updateRolePermissionsByCodes: async (roleId: string, codes: string[]) => {
    let rolePerms: Permission[] = []
    try {
      const loaded = await fetchRolePermissionsFromApi(roleId)
      rolePerms = loaded.permissions
    } catch {
      // fallback catalog below
    }

    const catalogPerms = await fetchPermissionsFromApi()
    const mergedByCode = new Map<string, Permission>()
    for (const item of [...catalogPerms, ...rolePerms]) {
      if (item.code && isValidPermissionUuid(item.id)) {
        mergedByCode.set(item.code, item)
      }
    }

    const { ids, missingCodes } = mapPermissionCodesToUuidIds(
      codes,
      Array.from(mergedByCode.values())
    )

    if (missingCodes.length > 0) {
      throw new Error(
        `Không tìm thấy quyền trên máy chủ (${missingCodes.length} mã). Vui lòng tải lại trang hoặc liên hệ quản trị.`
      )
    }

    return systemAdminMockApi.updateRolePermissions(roleId, ids)
  },

  deleteRole: async (roleId: string) => {
    await apiClient.delete(`/roles/${roleId}`)
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
      canAssignReports?: boolean
      can_assign_reports?: boolean
      description?: string | null
    }

    const response = await apiClient.get<{ items: BeOrgNode[] } | BeOrgNode[]>(
      '/orgs',
      {
        params: { q: '', isActive: true },
      }
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])

    return items.map<OrganizationUnit>((org) => ({
      id: org.id,
      code: org.code ?? '',
      name: org.name ?? '',
      level: org.level ?? 2,
      parentId: org.parentId ?? null,
      description: org.description ?? null,
      status:
        org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      canAssignReports: Boolean(
        org.canAssignReports ?? org.can_assign_reports ?? true
      ),
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
      canAssignReports: input.canAssignReports,
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
          canAssignReports: input.canAssignReports ?? true,
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
      canAssignReports: input.canAssignReports,
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

    let response: {
      data:
      | { items?: BeReportPeriod[] }
      | { data?: BeReportPeriod[] }
      | BeReportPeriod[]
    }
    try {
      response = await apiClient.get<
        | { items: BeReportPeriod[] }
        | { data?: BeReportPeriod[] }
        | BeReportPeriod[]
      >('/report-periods', { params: { page: 1, limit: 200 } })
    } catch {
      response = await apiClient.get<
        | { items: BeReportPeriod[] }
        | { data?: BeReportPeriod[] }
        | BeReportPeriod[]
      >('/report-periods')
    }
    const payload = response.data
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown }).data)
        ? ((payload as { data: BeReportPeriod[] }).data ?? [])
        : ((payload as { items?: BeReportPeriod[] }).items ?? [])

    return items.map<ReportPeriod>((period) => ({
      id: period.id,
      code: period.code ?? '',
      name: period.name ?? '',
      periodType: (period.periodType ??
        period.type ??
        'THANG') as ReportPeriod['periodType'],
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
      canAssignReports?: boolean
      can_assign_reports?: boolean
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

    const response = await apiClient.get<{ items: BeOrgNode[] } | BeOrgNode[]>(
      '/orgs',
      {
        params: requestParams,
      }
    )
    const payload = response.data
    const nodes = Array.isArray(payload) ? payload : (payload.items ?? [])

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
      status:
        org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      canAssignReports: Boolean(
        org.canAssignReports ?? org.can_assign_reports ?? true
      ),
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
      canAssignReports?: boolean
      can_assign_reports?: boolean
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
      status:
        org.isActive === false || org.status === 'locked' ? 'locked' : 'active',
      canAssignReports: Boolean(
        org.canAssignReports ?? org.can_assign_reports ?? true
      ),
      memberCount: 0,
      activeAssignments: 0,
    } satisfies OrganizationUnit
  },

  create: async (input: CreateUnitInput) => {
    const description =
      typeof input.description === 'string' &&
        input.description.trim().length > 0
        ? input.description.trim()
        : null

    const response = await apiClient.post('/orgs', {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description,
      canAssignReports: input.canAssignReports,
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
      typeof input.description === 'string' &&
        input.description.trim().length > 0
        ? input.description.trim()
        : null

    await apiClient.patch(`/orgs/${id}`, {
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      description,
      canAssignReports: input.canAssignReports,
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
