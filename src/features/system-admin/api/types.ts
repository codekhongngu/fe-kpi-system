export type UserStatus = 'active' | 'inactive'
export type UnitStatus = 'active' | 'locked'
export type DataScope = 'all_units' | 'own_unit' | 'child_units'
export type PeriodType = 'week' | 'month' | 'quarter' | 'year'

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
  name: string
  description: string
  dataScope: DataScope
  permissions: string[]
  isDefault: boolean
}

export type OrganizationUnit = {
  id: string
  code: string
  name: string
  level: 'agency' | 'department' | 'team' | 'group'
  parentId: string | null
  leaderName: string
  status: UnitStatus
  memberCount: number
  activeAssignments: number
}

export type ReportPeriod = {
  id: string
  code: string
  name: string
  type: PeriodType
  startDate: string
  endDate: string
  status: 'open' | 'closed'
  assignedFormsCount: number
}

export type CreateUserInput = Omit<
  SystemUser,
  'id' | 'lastLoginAt' | 'incompleteReports' | 'isDeleted'
>

export type UpdateUserInput = Omit<CreateUserInput, 'userCode'>

export type CreateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type UpdateRoleInput = Omit<Role, 'id' | 'isDefault'>

export type CreateUnitInput = Omit<OrganizationUnit, 'id' | 'memberCount' | 'activeAssignments'>

export type UpdateUnitInput = Omit<
  OrganizationUnit,
  'id' | 'memberCount' | 'activeAssignments'
>

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
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
]

export const unitLevelOptions: Array<{
  value: OrganizationUnit['level']
  label: string
}> = [
  { value: 'agency', label: 'Cơ quan' },
  { value: 'department', label: 'Phòng ban' },
  { value: 'team', label: 'Bộ phận' },
  { value: 'group', label: 'Nhóm' },
]
