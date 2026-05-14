import {
  LayoutDashboard,
  Bell,
  Building2,
  ChartColumnBig,
  FileCheck2,
  FileSpreadsheet,
  SearchCheck,
  SendToBack,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { type NavGroup, type SidebarData } from '../types'

export type AppRole =
  | 'SYSTEM_ADMIN'
  | 'DATA_MANAGER'
  | 'DATA_ENTRY'
  | 'APPROVER'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeToken(value: string) {
  return value.trim().toUpperCase()
}

function getRoleIdsFromUser(user: unknown): string[] {
  if (!isRecord(user)) return []
  const roleIds = user.roleIds
  if (Array.isArray(roleIds)) {
    return roleIds.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function getRoleCodesForUser(
  user: unknown,
  rolesById?: Record<string, string>
): string[] {
  const roleIds = getRoleIdsFromUser(user)
  if (roleIds.length === 0) return []

  if (rolesById) {
    const codes = roleIds
      .map((id) => rolesById[id])
      .filter(
        (code): code is string => typeof code === 'string' && code.length > 0
      )
    if (codes.length > 0) {
      return codes.map(normalizeToken)
    }
  }

  const isAllUuid = roleIds.every(isUuidLike)
  if (isAllUuid) return []

  return roleIds.map(normalizeToken)
}

export function getAppRoleForUser(
  user: unknown,
  rolesById?: Record<string, string>
): AppRole {
  if (isRecord(user)) {
    const username =
      typeof user.username === 'string'
        ? user.username.trim().toLowerCase()
        : ''
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
    if (
      username.includes('system_admin') ||
      email.startsWith('system_admin@')
    ) {
      return 'SYSTEM_ADMIN'
    }
  }

  const codes = getRoleCodesForUser(user, rolesById)

  const has = (predicate: (code: string) => boolean) => codes.some(predicate)
  const matchAny = (tokens: string[]) =>
    has((code) => tokens.includes(code) || tokens.some((t) => code.includes(t)))

  if (
    matchAny(['SYSTEM_ADMIN', 'SYS_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'QUAN_TRI'])
  ) {
    return 'SYSTEM_ADMIN'
  }
  if (matchAny(['DATA_MANAGER', 'MANAGER', 'QLDL', 'QUAN_LY_DU_LIEU'])) {
    return 'DATA_MANAGER'
  }
  if (matchAny(['APPROVER', 'PHE_DUYET', 'LEADER', 'LANH_DAO'])) {
    return 'APPROVER'
  }

  return 'DATA_ENTRY'
}

function buildNavGroups(): NavGroup[] {
  return [
    {
      title: 'Tổng quan',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Quản trị hệ thống',
      items: [
        {
          title: 'Quản lý đơn vị',
          url: '/system-admin?tab=units',
          icon: Building2,
        },
        {
          title: 'Lĩnh vực biểu mẫu',
          url: '/form-category-management',
          icon: FileSpreadsheet,
        },
        {
          title: 'Tài khoản',
          url: '/system-admin?tab=users',
          icon: Users,
        },
        {
          title: 'Vai trò',
          url: '/system-admin?tab=roles',
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: 'Quản trị Báo cáo',
      items: [
        {
          title: 'Quản lý biểu mẫu',
          url: '/form-management',
          icon: FileSpreadsheet,
        },
        {
          title: 'Quản trị đợt báo cáo',
          url: '/report-management',
          icon: SearchCheck,
        }
      ],
    },
    {
      title: 'Cá nhân & Tác nghiệp',
      items: [
        {
          title: 'Nhiệm vụ & Phê duyệt',
          url: '/my/assignments',
          icon: FileCheck2,
        },
      ],
    },
  ]
}

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navGroups: buildNavGroups(),
}

export function getSidebarNavGroupsForUser(
  user: unknown,
  rolesById?: Record<string, string>
) {
  void user
  void rolesById
  return buildNavGroups()
}
