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
>

export type UpdateUserInput = Omit<CreateUserInput, 'userCode'>

export type CreateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type UpdateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type CreateUnitInput = {
  code: string
  name: string
  parentId: string | null
  level: number
  description: string
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
