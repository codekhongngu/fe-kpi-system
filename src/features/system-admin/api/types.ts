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
  isDefault: boolean
}

export type Permission = {
  id: string
  code: string
  name: string
  description?: string | null
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

export const rolePermissionCatalog: string[] = [
  'feature:view',
  'feature:create',
  'feature:update',
  'feature:delete',
  'feature:export',
  'report:assign',
  'report:approve',
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
