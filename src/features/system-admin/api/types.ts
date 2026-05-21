export type UserStatus = 'active' | 'inactive'
export type UnitStatus = 'active' | 'locked'
export type DataScope = 'all_units' | 'own_unit' | 'child_units'
export type PeriodType = 'TUAN' | 'THANG' | 'QUY' | 'NAM'

export type SystemUser = {
  id: string
  userCode: string
  fullName: string
  email: string
  username: string
  unitId: string
  roleIds: string[]
  status: UserStatus
  lastLoginAt: string | null
  incompleteReports: number
  isDeleted: boolean
}

export type Role = {
  id: string
  code: string
  name: string
  description: string
  dataScope: DataScope
  permissionIds: string[]
  permissions: string[]
  /** Số quyền đã gán — từ GET /roles?include=permissionCount */
  permissionCount: number
  isDefault: boolean
}

export type Permission = {
  id: string
  code: string
  name: string
  description?: string | null
}

export type RolePermissionsResult = {
  permissionIds: string[]
  permissionCodes: string[]
  permissions: Permission[]
}

export type OrganizationUnit = {
  id: string
  code: string
  name: string
  level: number
  parentId: string | null
  description: string | null
  status: UnitStatus
  canAssignReports: boolean
  memberCount: number
  activeAssignments: number
}

export type ReportPeriod = {
  id: string
  code: string
  name: string
  periodType: PeriodType
  dateFrom: string
  dateTo: string
  isActive: boolean
  assignedFormsCount: number
}

export type CreateUserInput = Omit<
  SystemUser,
  'id' | 'lastLoginAt' | 'incompleteReports' | 'isDeleted'
> & {
  password: string
}

export type UpdateUserInput = Omit<CreateUserInput, 'userCode'>

export type CreateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type UpdateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type CreateUnitInput = {
  code: string
  name: string
  parentId: string | null
  level: number
  description: string
  canAssignReports: boolean
}

export type UpdateUnitInput = CreateUnitInput

export type CreatePeriodInput = Omit<ReportPeriod, 'id' | 'assignedFormsCount'>

export type UpdatePeriodInput = Omit<ReportPeriod, 'id' | 'assignedFormsCount'>

export const dataScopes: Array<{ value: DataScope; label: string }> = [
  { value: 'all_units', label: 'Toàn hệ thống' },
  { value: 'own_unit', label: 'Đơn vị mình' },
  { value: 'child_units', label: 'Đơn vị con' },
]

export const periodTypeOptions: Array<{ value: PeriodType; label: string }> = [
  { value: 'TUAN', label: 'Tuần' },
  { value: 'THANG', label: 'Tháng' },
  { value: 'QUY', label: 'Quý' },
  { value: 'NAM', label: 'Năm' },
]

export const unitLevelOptions: Array<{
  value: OrganizationUnit['level']
  label: string
}> = [
  { value: 1, label: 'Cơ quan' },
  { value: 2, label: 'Phòng ban' },
  { value: 3, label: 'Bộ phận' },
  { value: 4, label: 'Nhóm' },
]

// ===== PERMISSION GROUPS (cố định, dùng cho RolesTab) =====

export type PermissionItem = {
  code: string
  label: string
}

export type PermissionGroup = {
  key: string
  label: string
  icon: string
  permissions: PermissionItem[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊',
    permissions: [{ code: 'dashboard.view', label: 'Xem Dashboard' }] },
  { key: 'units', label: 'Quản lý đơn vị', icon: '🏢',
    permissions: [
      { code: 'units.view', label: 'Xem đơn vị' },
      { code: 'units.create', label: 'Thêm đơn vị' },
      { code: 'units.update', label: 'Sửa đơn vị' },
      { code: 'units.delete', label: 'Xóa đơn vị' },
    ]},
  { key: 'field-categories', label: 'Lĩnh vực biểu mẫu', icon: '📁',
    permissions: [
      { code: 'field-categories.view', label: 'Xem lĩnh vực' },
      { code: 'field-categories.create', label: 'Thêm lĩnh vực' },
      { code: 'field-categories.update', label: 'Sửa lĩnh vực' },
      { code: 'field-categories.delete', label: 'Xóa lĩnh vực' },
    ]},
  { key: 'users', label: 'Tài khoản người dùng', icon: '👤',
    permissions: [
      { code: 'users.view', label: 'Xem tài khoản' },
      { code: 'users.create', label: 'Thêm tài khoản' },
      { code: 'users.update', label: 'Sửa tài khoản' },
      { code: 'users.delete', label: 'Xóa tài khoản' },
      { code: 'users.reset-password', label: 'Reset mật khẩu' },
      { code: 'users.toggle-status', label: 'Kích hoạt / Vô hiệu hóa' },
    ]},
  { key: 'roles', label: 'Vai trò & Phân quyền', icon: '🔑',
    permissions: [
      { code: 'roles.view', label: 'Xem vai trò' },
      { code: 'roles.update', label: 'Cập nhật quyền vai trò' },
    ]},
  { key: 'forms', label: 'Quản lý biểu mẫu', icon: '📋',
    permissions: [
      { code: 'forms.view', label: 'Xem biểu mẫu' },
      { code: 'forms.create', label: 'Tạo biểu mẫu' },
      { code: 'forms.update', label: 'Sửa biểu mẫu' },
      { code: 'forms.delete', label: 'Xóa biểu mẫu' },
      { code: 'forms.manage-structure', label: 'Cấu hình cấu trúc biểu mẫu' },
      { code: 'forms.publish', label: 'Phát hành biểu mẫu' },
    ]},
  { key: 'report-campaigns', label: 'Quản trị đợt báo cáo', icon: '📅',
    permissions: [
      { code: 'report-campaigns.view', label: 'Xem đợt báo cáo' },
      { code: 'report-campaigns.create', label: 'Tạo đợt báo cáo' },
      { code: 'report-campaigns.update', label: 'Sửa đợt báo cáo' },
      { code: 'report-campaigns.delete', label: 'Xóa đợt báo cáo' },
      { code: 'report-campaigns.dispatch', label: 'Giao báo cáo cho đơn vị' },
      { code: 'report-campaigns.recall', label: 'Thu hồi báo cáo' },
      { code: 'report-campaigns.view-all', label: 'Xem báo cáo toàn hệ thống' },
    ]},
  { key: 'submissions-approvals', label: 'Nhiệm vụ & Phê duyệt', icon: '✅',
    permissions: [
      { code: 'submissions.view-assigned', label: 'Xem nhiệm vụ được giao' },
      { code: 'submissions.input', label: 'Nhập liệu báo cáo' },
      { code: 'submissions.submit', label: 'Nộp báo cáo' },
      { code: 'submissions.cancel', label: 'Rút lại nộp' },
      { code: 'approvals.view', label: 'Xem danh sách phê duyệt' },
      { code: 'approvals.approve', label: 'Phê duyệt báo cáo' },
      { code: 'approvals.reject', label: 'Trả lại báo cáo' },
    ]},
]

export const ALL_PERMISSION_CODES: string[] =
  PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.code))

const CATALOG_LABEL_BY_CODE = new Map(
  PERMISSION_GROUPS.flatMap((g) =>
    g.permissions.map((p) => [p.code, p.label] as const)
  )
)

type PermissionGroupMeta = { label: string; icon: string; order: number }

/** Meta nhóm quyền (icon/label) — submissions & approvals tách riêng */
const PERMISSION_GROUP_META_BY_KEY: Record<string, PermissionGroupMeta> = {
  dashboard: { label: 'Dashboard', icon: '📊', order: 0 },
  units: { label: 'Quản lý đơn vị', icon: '🏢', order: 10 },
  'field-categories': { label: 'Lĩnh vực biểu mẫu', icon: '📁', order: 20 },
  users: { label: 'Tài khoản người dùng', icon: '👤', order: 30 },
  roles: { label: 'Vai trò & Phân quyền', icon: '🔑', order: 40 },
  forms: { label: 'Quản lý biểu mẫu', icon: '📋', order: 50 },
  'report-campaigns': { label: 'Quản trị đợt báo cáo', icon: '📅', order: 60 },
  submissions: { label: 'Nhiệm vụ', icon: '📥', order: 70 },
  approvals: { label: 'Phê duyệt', icon: '✅', order: 80 },
  'submissions-approvals': {
    label: 'Nhiệm vụ & Phê duyệt',
    icon: '✅',
    order: 75,
  },
}

function getPermissionGroupMeta(key: string): PermissionGroupMeta {
  return (
    PERMISSION_GROUP_META_BY_KEY[key] ?? {
      label: titleizeGroupKey(key),
      icon: '📌',
      order: 900,
    }
  )
}

function permissionGroupKeyFromCode(code: string): string {
  const dot = code.indexOf('.')
  return dot > 0 ? code.slice(0, dot) : code
}

function titleizeGroupKey(key: string): string {
  return key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Danh sách quyền phẳng từ GET /roles/:id/permissions */
export function flattenRolePermissionsForMatrix(
  data: RolePermissionsResult
): Permission[] {
  if (data.permissions.length > 0) {
    return data.permissions.filter((p) => Boolean(p.code?.trim()))
  }

  const items: Permission[] = []
  const codes = data.permissionCodes.map((c) => c.trim()).filter(Boolean)
  const ids = data.permissionIds

  if (codes.length > 0 && codes.length === ids.length) {
    for (let i = 0; i < codes.length; i += 1) {
      const code = codes[i]
      items.push({
        id: ids[i] ?? '',
        code,
        name: CATALOG_LABEL_BY_CODE.get(code) ?? code,
        description: null,
      })
    }
    return items
  }

  for (const code of codes) {
    items.push({
      id: '',
      code,
      name: CATALOG_LABEL_BY_CODE.get(code) ?? code,
      description: null,
    })
  }

  return items
}

export function permissionIdsFromRolePermissions(
  data: RolePermissionsResult
): string[] {
  const flat = flattenRolePermissionsForMatrix(data)
  const fromFlat = flat
    .map((p) => p.id)
    .filter((id) => isValidPermissionUuid(id))
  if (fromFlat.length > 0) return fromFlat
  return data.permissionIds.filter((id) => isValidPermissionUuid(id))
}

/** Nhóm quyền cho ma trận UI — nguồn từ GET /permissions (danh sách đầy đủ) */
export function buildPermissionMatrixGroups(
  permissions: Permission[]
): PermissionGroup[] {
  const byKey = new Map<string, PermissionItem[]>()

  for (const perm of permissions) {
    const code = perm.code.trim()
    if (!code) continue
    const key = permissionGroupKeyFromCode(code)
    const list = byKey.get(key) ?? []
    list.push({
      code,
      label: CATALOG_LABEL_BY_CODE.get(code) ?? (perm.name?.trim() || code),
    })
    byKey.set(key, list)
  }

  return [...byKey.entries()]
    .sort(([keyA], [keyB]) => {
      const orderA = getPermissionGroupMeta(keyA).order
      const orderB = getPermissionGroupMeta(keyB).order
      if (orderA !== orderB) return orderA - orderB
      return keyA.localeCompare(keyB, 'vi')
    })
    .map(([key, items]) => {
      const meta = getPermissionGroupMeta(key)
      return {
        key,
        label: meta.label,
        icon: meta.icon,
        permissions: [...items].sort((a, b) =>
          a.label.localeCompare(b.label, 'vi')
        ),
      }
    })
}

/** 4 vai trò cố định — thứ tự hiển thị trên RolesTab */
export const FIXED_ROLES: Array<{
  id: string
  code: string
  name: string
  description: string
  dataScope: DataScope
  isDefault: boolean
}> = [
  {
    id: 'role-super-admin',
    code: 'SUPER_ADMIN',
    name: 'Quản trị viên hệ thống',
    description: 'Toàn quyền quản trị hệ thống',
    dataScope: 'all_units',
    isDefault: true,
  },
  {
    id: 'role-commune-manager',
    code: 'COMMUNE_MANAGER',
    name: 'Quản lý xã',
    description: 'Quản lý biểu mẫu, đợt báo cáo và phê duyệt cấp xã',
    dataScope: 'all_units',
    isDefault: true,
  },
  {
    id: 'role-dept-manager',
    code: 'DEPARTMENT_MANAGER',
    name: 'Quản lý phòng ban',
    description: 'Xem báo cáo đơn vị và phê duyệt nội bộ phòng',
    dataScope: 'child_units',
    isDefault: true,
  },
  {
    id: 'role-dept-staff',
    code: 'DEPARTMENT_STAFF',
    name: 'Cán bộ phòng ban',
    description: 'Nhập và nộp báo cáo được giao',
    dataScope: 'own_unit',
    isDefault: true,
  },
]

export const FIXED_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  COMMUNE_MANAGER: [
    'dashboard.view',
    'field-categories.view', 'field-categories.create', 'field-categories.update',
    'forms.view', 'forms.create', 'forms.update', 'forms.manage-structure', 'forms.publish',
    'report-campaigns.view', 'report-campaigns.create', 'report-campaigns.update',
    'report-campaigns.dispatch', 'report-campaigns.recall', 'report-campaigns.view-all',
    'submissions.view-assigned', 'submissions.input', 'submissions.submit', 'submissions.cancel',
    'approvals.view', 'approvals.approve', 'approvals.reject',
  ],
  DEPARTMENT_MANAGER: [
    'dashboard.view',
    'report-campaigns.view', 'report-campaigns.view-all',
    'submissions.view-assigned',
    'approvals.view', 'approvals.approve', 'approvals.reject',
  ],
  DEPARTMENT_STAFF: [
    'dashboard.view',
    'submissions.view-assigned', 'submissions.input',
    'submissions.submit', 'submissions.cancel',
  ],
}

const PERMISSION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidPermissionUuid(id: string): boolean {
  return PERMISSION_UUID_RE.test(id.trim())
}

export function mapPermissionCodesToUuidIds(
  codes: string[],
  permissions: Pick<Permission, 'id' | 'code'>[]
): { ids: string[]; missingCodes: string[] } {
  const byCode = new Map<string, string>()
  for (const permission of permissions) {
    const code = (permission.code ?? '').trim()
    if (!code || !isValidPermissionUuid(permission.id)) continue
    byCode.set(code, permission.id)
  }

  const ids: string[] = []
  const missingCodes: string[] = []
  for (const code of codes) {
    const id = byCode.get(code)
    if (id) ids.push(id)
    else missingCodes.push(code)
  }

  return { ids, missingCodes }
}
