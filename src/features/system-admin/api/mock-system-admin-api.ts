import {
  type CreatePeriodInput,
  type CreateRoleInput,
  type CreateUnitInput,
  type CreateUserInput,
  type OrganizationUnit,
  type ReportPeriod,
  type Role,
  type SystemUser,
  type UpdatePeriodInput,
  type UpdateRoleInput,
  type UpdateUnitInput,
  type UpdateUserInput,
} from './types'

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
      level: 'agency',
      parentId: null,
      leaderName: 'Nguyễn Văn A',
      status: 'active',
      memberCount: 8,
      activeAssignments: 1,
    },
    {
      id: 'u2',
      code: 'PB-010',
      name: 'Phòng Nội vụ',
      level: 'department',
      parentId: 'u1',
      leaderName: 'Trần Thị B',
      status: 'active',
      memberCount: 4,
      activeAssignments: 0,
    },
    {
      id: 'u3',
      code: 'BP-021',
      name: 'Bộ phận KPI',
      level: 'team',
      parentId: 'u2',
      leaderName: 'Lê Văn C',
      status: 'active',
      memberCount: 3,
      activeAssignments: 2,
    },
    {
      id: 'u4',
      code: 'NH-001',
      name: 'Nhóm Tổng hợp',
      level: 'group',
      parentId: 'u3',
      leaderName: 'Phạm Thị D',
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

export const systemAdminMockApi = {
  listUsers: () =>
    simulate(() => db.users.filter((user) => !user.isDeleted).map((user) => ({ ...user }))),

  createUser: (input: CreateUserInput) =>
    simulate(() => {
      uniqueUserConstraint(input)
      const unit = ensureUnitExists(input.unitId)
      ensureRolesExist(input.roleIds)

      const newUser: SystemUser = {
        id: nextId('usr', db.users),
        ...input,
        status: unit.status === 'locked' ? 'inactive' : input.status,
        lastLoginAt: null,
        incompleteReports: 0,
        isDeleted: false,
      }
      db.users.unshift(newUser)
      const selectedUnit = db.units.find((item) => item.id === newUser.unitId)
      if (selectedUnit) {
        selectedUnit.memberCount += 1
      }
      return { ...newUser }
    }),

  updateUser: (userId: string, input: UpdateUserInput) =>
    simulate(() => {
      const user = db.users.find((item) => item.id === userId && !item.isDeleted)
      if (!user) {
        throw new Error('Không tìm thấy người dùng.')
      }
      uniqueUserConstraint({ ...input, userCode: user.userCode, id: user.id })
      ensureUnitExists(input.unitId)
      ensureRolesExist(input.roleIds)

      if (user.unitId !== input.unitId) {
        const oldUnit = db.units.find((unit) => unit.id === user.unitId)
        if (oldUnit && oldUnit.memberCount > 0) {
          oldUnit.memberCount -= 1
        }
        const newUnit = db.units.find((unit) => unit.id === input.unitId)
        if (newUnit) {
          newUnit.memberCount += 1
        }
      }

      Object.assign(user, input)
      return { ...user }
    }),

  toggleUserStatus: (userId: string) =>
    simulate(() => {
      const user = db.users.find((item) => item.id === userId && !item.isDeleted)
      if (!user) {
        throw new Error('Không tìm thấy người dùng.')
      }
      user.status = user.status === 'active' ? 'inactive' : 'active'
      return { ...user }
    }),

  resetUserPassword: (userId: string) =>
    simulate(() => {
      const user = db.users.find((item) => item.id === userId && !item.isDeleted)
      if (!user) {
        throw new Error('Không tìm thấy người dùng.')
      }
      return {
        tempPassword: `Kpi@${Math.floor(100000 + Math.random() * 900000)}`,
        email: user.email,
      }
    }),

  deleteUser: (userId: string) =>
    simulate(() => {
      const user = db.users.find((item) => item.id === userId && !item.isDeleted)
      if (!user) {
        throw new Error('Không tìm thấy người dùng.')
      }
      if (user.incompleteReports > 0) {
        throw new Error('Không thể xóa người dùng đang có báo cáo chưa hoàn thành.')
      }
      user.isDeleted = true
      user.status = 'inactive'
      const unit = db.units.find((item) => item.id === user.unitId)
      if (unit && unit.memberCount > 0) {
        unit.memberCount -= 1
      }
      return true
    }),

  listRoles: () => simulate(() => db.roles.map((role) => ({ ...role }))),

  createRole: (input: CreateRoleInput) =>
    simulate(() => {
      const duplicated = db.roles.find(
        (role) => normalize(role.name) === normalize(input.name)
      )
      if (duplicated) {
        throw new Error('Tên nhóm quyền đã tồn tại.')
      }
      const role: Role = {
        id: nextId('role', db.roles),
        ...input,
        isDefault: false,
      }
      db.roles.unshift(role)
      return { ...role }
    }),

  updateRole: (roleId: string, input: UpdateRoleInput) =>
    simulate(() => {
      const role = db.roles.find((item) => item.id === roleId)
      if (!role) {
        throw new Error('Không tìm thấy nhóm quyền.')
      }
      const duplicated = db.roles.find(
        (item) => item.id !== roleId && normalize(item.name) === normalize(input.name)
      )
      if (duplicated) {
        throw new Error('Tên nhóm quyền đã tồn tại.')
      }
      Object.assign(role, input)
      return { ...role }
    }),

  deleteRole: (roleId: string) =>
    simulate(() => {
      const role = db.roles.find((item) => item.id === roleId)
      if (!role) {
        throw new Error('Không tìm thấy nhóm quyền.')
      }
      if (role.isDefault || DEFAULT_ROLE_NAMES.has(role.name)) {
        throw new Error('Không được xóa nhóm quyền mặc định hệ thống.')
      }
      const assigned = db.users.some((user) => !user.isDeleted && user.roleIds.includes(roleId))
      if (assigned) {
        throw new Error('Không thể xóa nhóm quyền đang có người dùng sử dụng.')
      }
      db.roles = db.roles.filter((item) => item.id !== roleId)
      return true
    }),

  listUnits: () => simulate(() => db.units.map((unit) => ({ ...unit }))),

  createUnit: (input: CreateUnitInput) =>
    simulate(() => {
      const duplicated = db.units.find(
        (unit) => normalize(unit.code) === normalize(input.code)
      )
      if (duplicated) {
        throw new Error('Mã đơn vị đã tồn tại.')
      }
      if (input.parentId) {
        ensureUnitExists(input.parentId)
      }
      const unit: OrganizationUnit = {
        id: nextId('unit', db.units),
        ...input,
        memberCount: 0,
        activeAssignments: 0,
      }
      db.units.unshift(unit)
      return { ...unit }
    }),

  updateUnit: (unitId: string, input: UpdateUnitInput) =>
    simulate(() => {
      const unit = db.units.find((item) => item.id === unitId)
      if (!unit) {
        throw new Error('Không tìm thấy đơn vị.')
      }
      const duplicated = db.units.find(
        (item) => item.id !== unitId && normalize(item.code) === normalize(input.code)
      )
      if (duplicated) {
        throw new Error('Mã đơn vị đã tồn tại.')
      }
      if (input.parentId && input.parentId === unit.id) {
        throw new Error('Đơn vị cha không hợp lệ.')
      }
      if (input.parentId) {
        ensureUnitExists(input.parentId)
      }
      Object.assign(unit, input)
      return { ...unit }
    }),

  toggleUnitStatus: (unitId: string) =>
    simulate(() => {
      const unit = db.units.find((item) => item.id === unitId)
      if (!unit) {
        throw new Error('Không tìm thấy đơn vị.')
      }
      unit.status = unit.status === 'active' ? 'locked' : 'active'

      if (unit.status === 'locked') {
        db.users.forEach((user) => {
          if (!user.isDeleted && user.unitId === unit.id) {
            user.status = 'inactive'
          }
        })
      }
      return { ...unit }
    }),

  deleteUnit: (unitId: string) =>
    simulate(() => {
      const unit = db.units.find((item) => item.id === unitId)
      if (!unit) {
        throw new Error('Không tìm thấy đơn vị.')
      }
      const hasChild = db.units.some((item) => item.parentId === unit.id)
      if (hasChild) {
        throw new Error('Không thể xóa đơn vị đang có đơn vị con.')
      }
      if (unit.memberCount > 0 || unit.activeAssignments > 0) {
        throw new Error(
          'Không thể xóa đơn vị khi còn thành viên hoặc còn biểu mẫu/báo cáo đang thực hiện.'
        )
      }
      db.units = db.units.filter((item) => item.id !== unitId)
      return true
    }),

  listPeriods: () => simulate(() => db.periods.map((period) => ({ ...period }))),

  createPeriod: (input: CreatePeriodInput) =>
    simulate(() => {
      ensurePeriodDateRange(input.startDate, input.endDate)
      if (hasPeriodOverlap(input.type, input.startDate, input.endDate)) {
        throw new Error('Kỳ báo cáo cùng loại đang bị trùng thời gian.')
      }
      const period: ReportPeriod = {
        id: nextId('prd', db.periods),
        ...input,
        assignedFormsCount: 0,
      }
      db.periods.unshift(period)
      return { ...period }
    }),

  updatePeriod: (periodId: string, input: UpdatePeriodInput) =>
    simulate(() => {
      const period = db.periods.find((item) => item.id === periodId)
      if (!period) {
        throw new Error('Không tìm thấy kỳ báo cáo.')
      }
      ensurePeriodDateRange(input.startDate, input.endDate)
      if (hasPeriodOverlap(input.type, input.startDate, input.endDate, periodId)) {
        throw new Error('Kỳ báo cáo cùng loại đang bị trùng thời gian.')
      }
      Object.assign(period, input)
      return { ...period }
    }),

  deletePeriod: (periodId: string) =>
    simulate(() => {
      const period = db.periods.find((item) => item.id === periodId)
      if (!period) {
        throw new Error('Không tìm thấy kỳ báo cáo.')
      }
      if (period.assignedFormsCount > 0) {
        throw new Error('Không được xóa kỳ báo cáo khi đã có biểu mẫu được giao cho kỳ đó.')
      }
      db.periods = db.periods.filter((item) => item.id !== periodId)
      return true
    }),
}
